import imaps from 'imap-simple';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import prisma from './prisma';
import { generateTicketId } from './utils';
import logger from './logger';
import { ErrorUtils } from './error-utils';
import { EmailUtils } from './email-utils';
import { sendNotificationEmail } from './notification-service';

// Main function to sync a specific mailbox
export async function syncMailbox(mailboxId: string) {  
  try {
    logger.info(`Starting mailbox sync for mailboxId: ${mailboxId}`);
    
    if (!mailboxId) {
      logger.error('No mailbox ID provided');
      return { success: false, error: 'No mailbox ID provided', mailboxId: null };
    }
    
    // Fetch mailbox info from database
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: mailboxId },
      include: { company: true }
    });

    if (!mailbox) {
      logger.error(`Mailbox with ID ${mailboxId} not found`);
      return { success: false, error: `Mailbox with ID ${mailboxId} not found`, mailboxId };
    }

    if (!mailbox.isActive) {
      logger.info(`Skipping inactive mailbox: ${mailbox.name} (${mailbox.email})`);
      return { success: true, message: 'Mailbox is inactive', mailboxId };
    }

    // Connect to IMAP server
    const config = {
      imap: {
        user: mailbox.imapUser || '',
        password: mailbox.imapPass || '',
        host: mailbox.imapHost || '',
        port: mailbox.imapPort || 993,
        tls: mailbox.imapSSL,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };

    // Establish connection
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Get only unseen emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], markSeen: true };    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    logger.info(`Found ${messages.length} new messages for ${mailbox.email}`, { 
      companyId: mailbox.companyId,
      companySlug: mailbox.company?.slug,
      mailboxId: mailbox.id 
    });

    // Process each email
    for (const message of messages) {
      const all = message.parts.find(part => part.which === '');
      if (!all) continue;
      
      // Parse the email
      const parsedEmail = await simpleParser(all.body);

      // Extract data
      const messageId = parsedEmail.messageId || `generated-${Date.now()}-${Math.random()}`;
      const fromEmail = parsedEmail.from?.value?.[0]?.address || '';
      const fromName = parsedEmail.from?.value?.[0]?.name || '';
      const subject = parsedEmail.subject || '(No subject)';
      const toEmails = parsedEmail.to?.value?.map((addr: { address: string }) => addr.address) || [];
      const ccEmails = parsedEmail.cc?.value?.map((addr: { address: string }) => addr.address) || [];
      const bccEmails = parsedEmail.bcc?.value?.map((addr: { address: string }) => addr.address) || [];
      const body = parsedEmail.text || '';
      const bodyHtml = parsedEmail.html || '';

      // Store email in database - sanitize HTML content for security
      const sanitizedHtml = EmailUtils.sanitizeHtml(bodyHtml);
      
      const email = await prisma.email.create({
        data: {
          messageId,
          subject,
          fromEmail,
          fromName,
          toEmail: toEmails,
          ccEmail: ccEmails,
          bccEmail: bccEmails,
          body,
          bodyHtml: sanitizedHtml || undefined,
          receivedAt: parsedEmail.date || new Date(),
          mailboxId: mailbox.id,
          companyId: mailbox.companyId,
          rawMimeContent: all.body.toString(),
          headers: parsedEmail.headerLines.reduce((acc: Record<string, string>, h: {key: string, line: string}) => {
            acc[h.key] = h.line;
            return acc;
          }, {} as Record<string, string>),
          isProcessed: false, // Start as unprocessed
        }
      });

      // Check if this email is a reply to an existing thread by looking for related emails
      let existingTicketId = null;
      
      // Extract references and inReplyTo for threading
      const references = parsedEmail.references || [];
      const inReplyTo = parsedEmail.inReplyTo || null;
      
      if (inReplyTo || (Array.isArray(references) && references.length > 0)) {
        // Find related emails that might be part of the same thread
        const relatedEmails = await prisma.email.findMany({
          where: {
            OR: [
              { messageId: inReplyTo as string },
              { messageId: { in: Array.isArray(references) ? references : [references].filter(Boolean) as string[] } }
            ],
            companyId: mailbox.companyId
          },
          include: {
            tickets: true
          }
        });
        
        // Find the first email with a ticket
        for (const relatedEmail of relatedEmails) {
          if (relatedEmail.tickets && relatedEmail.tickets.length > 0) {
            existingTicketId = relatedEmail.tickets[0].id;
            break;
          }        }
      }

      // Check company's auto-reply settings
      const company = await prisma.company.findUnique({
        where: { id: mailbox.companyId },
        select: { 
          ticketIdPrefix: true,
          autoRepliesEnabled: true
        }
      });

      // Only auto-create tickets if auto-replies are enabled
      if (company?.autoRepliesEnabled) {
        // Auto-create a ticket from this email (or link to existing ticket)
        try {
          // Use the company's ticket prefix or default to 'AAR' as specified
          const prefix = company.ticketIdPrefix || 'AAR';
        
        // Count existing tickets for this company to determine next number
        const ticketCount = await prisma.ticket.count({
          where: { companyId: mailbox.companyId }
        });
        
        // Generate ticket number with sequential numbering
        const nextNumber = ticketCount + 1;
        const ticketNumber = generateTicketId(prefix, nextNumber);
        
        // Try to get system user first, if not available use company owner as fallback
        const systemUser = await prisma.user.findUnique({
          where: { id: 'system' }
        });
        
        // If system user doesn't exist, use company owner
        let creatorId = 'system';
        
        if (!systemUser) {
          // Get company owner as fallback
          const company = await prisma.company.findUnique({
            where: { id: mailbox.companyId },
            select: { ownerId: true }
          });
          
          if (!company) {
            throw new Error(`Company with ID ${mailbox.companyId} not found`);
          }
          
          creatorId = company.ownerId;
          logger.info(`System user not found, using company owner ${creatorId} as ticket creator`);
        }
        
        if (existingTicketId) {
          // Add this email to existing ticket
          logger.info(`Linking email ${email.id} to existing ticket: ${existingTicketId}`);
          
          // Get the existing ticket
          const existingTicket = await prisma.ticket.findUnique({
            where: { id: existingTicketId }
          });
          
          if (existingTicket) {
            // Link this email to the existing ticket
            await prisma.email.update({
              where: { id: email.id },
              data: {
                isProcessed: true, // Mark as processed
                tickets: {
                  connect: [{ id: existingTicketId }]
                }
              }
            });
              // Update the ticket status and timestamps
            await prisma.ticket.update({
              where: { id: existingTicketId },
              data: {
                updatedAt: new Date(),
                status: 'open', // Reopen ticket if it was closed
              }
            });
            
            // Send notification email for the reply
            await sendNotificationEmail({
              to: fromEmail,
              originalSubject: subject || '(No subject)',
              ticketNumber: existingTicket.ticketNumber,
              companyId: mailbox.companyId,
              ticketData: {
                id: existingTicket.id,
                subject: existingTicket.subject,
                priority: existingTicket.priority,
                status: 'open',
                createdAt: existingTicket.createdAt,
                customerName: fromName,
                customerEmail: fromEmail,
                assignee: null
              }
            });          } else {
            // If ticket doesn't exist anymore, create a new one
            const newTicket = await createNewTicket();
            // Send auto-reply if needed
            await sendAutoReply(mailbox, fromEmail, subject, newTicket.ticketNumber, newTicket);
            
            // Send notification email to the client
            await sendNotificationEmail({
              to: fromEmail,
              originalSubject: subject || '(No subject)',
              ticketNumber: newTicket.ticketNumber,
              companyId: mailbox.companyId,
              ticketData: {
                id: newTicket.id,
                subject: newTicket.subject,
                priority: newTicket.priority,
                status: newTicket.status,
                createdAt: newTicket.createdAt,
                customerName: fromName,
                customerEmail: fromEmail,
                assignee: null
              }
            });
          }} else {
          // Create a new ticket
          const newTicket = await createNewTicket();
          // Send auto-reply if needed
          await sendAutoReply(mailbox, fromEmail, subject, newTicket.ticketNumber, newTicket);
          
          // Send notification email to the client
          await sendNotificationEmail({
            to: fromEmail,
            originalSubject: subject || '(No subject)',
            ticketNumber: newTicket.ticketNumber,
            companyId: mailbox.companyId,
            ticketData: {
              id: newTicket.id,
              subject: newTicket.subject,
              priority: newTicket.priority,
              status: newTicket.status,
              createdAt: newTicket.createdAt,
              customerName: fromName,
              customerEmail: fromEmail,
              assignee: null
            }
          });
        }
        
        // Helper function to create a new ticket
        async function createNewTicket() {
          // Create ticket with valid creator
          const newTicket = await prisma.ticket.create({
            data: {
              ticketNumber,
              subject: subject || '(No subject)',
              status: 'open',
              priority: 'medium',
              creatorId: creatorId,
              companyId: mailbox?.companyId || '',
              emailId: email.id, // Link to this email
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          
          // Mark the email as processed
          await prisma.email.update({
            where: { id: email.id },
            data: {
              isProcessed: true,
            }
          });
          
          logger.info(`Created new ticket ${newTicket.ticketNumber} for email: ${email.id}`);
          return newTicket;
        }
      } catch (ticketError) {        logger.error(`Failed to create ticket for email: ${messageId}`, {
          error: ticketError,
          emailId: email.id
        });
        // Continue processing other emails even if one fails
      }
      } else {
        // If auto-replies are disabled, just log that email was stored
        logger.info(`Auto-replies disabled for company ${mailbox.companyId}, email stored without creating ticket: ${email.id}`);
      }
    }

    // Close the connection
    await connection.end();

    // Update mailbox last sync time
    await prisma.mailbox.update({
      where: { id: mailbox.id },
      data: {
        lastSyncAt: new Date(),
        status: 'active',
        lastError: null,
      },
    });
    
    logger.info(`Successfully synced mailbox ${mailboxId}`, { 
      processedCount: messages.length,
      companyId: mailbox.companyId,
      mailboxEmail: mailbox.email
    });
    
    return { success: true, mailboxId, processedCount: messages.length };
  } catch (error: any) {
    ErrorUtils.logError(error, 'syncMailbox', { mailboxId });
    
    // Update mailbox with error
    try {
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: {
          lastSyncAt: new Date(),
          status: 'error',
          lastError: error.message || 'Unknown error',
        },
      });
    } catch (dbError) {
      // If we can't update the database, log this as a separate error
      ErrorUtils.logError(dbError, 'syncMailbox.updateErrorStatus', { mailboxId });
    }
    
    return { 
      success: false, 
      mailboxId, 
      error: error.message || 'Unknown error occurred during mailbox sync'
    };
  }
}

// Helper function to send auto-replies
export async function sendAutoReply(mailbox: any, toEmail: string, subject: string, ticketNumber?: string, ticket?: any, customMessage?: string) {
  try {
    logger.debug('Preparing to send auto-reply', { 
      mailboxId: mailbox.id,
      recipient: toEmail,
      subject: `Re: ${subject}`
    });

    // Get the default auto-reply template for the company
    const template = await prisma.autoReplyTemplate.findFirst({
      where: {
        companyId: mailbox.companyId,
        isActive: true,
        isDefault: true
      }
    });

    if (!template) {
      logger.warn('No active default auto-reply template found, using fallback', { 
        companyId: mailbox.companyId 
      });
      
      // Fallback to original hardcoded template
      return await sendFallbackAutoReply(mailbox, toEmail, subject, ticketNumber);
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: mailbox.smtpHost,
      port: mailbox.smtpPort,
      secure: mailbox.smtpSSL,
      auth: {
        user: mailbox.smtpUser,
        pass: mailbox.smtpPass,
      },
    });    // Prepare template variables
    const { templateEngine } = await import('./auto-reply-templates');
    const variables = templateEngine.createTemplateVariables({
      companyName: mailbox.company?.name || 'Support',
      ticketNumber: ticketNumber || 'N/A',
      ticketPrefix: mailbox.company?.ticketIdPrefix || 'TCK',
      subject: subject,
      customerEmail: toEmail,
      supportEmail: mailbox.email,
      customerName: undefined, // Could be extracted from email headers if available
      assigneeName: ticket?.assignee?.displayName,
      priority: ticket?.priority || 'Medium',
      status: ticket?.status || 'Open',
      createdAt: ticket?.createdAt || new Date(),
      customMessage: customMessage || undefined // Add custom message to variables
    });

    // Render the template (or use custom message if provided)
    let renderedTemplate;
    if (customMessage) {
      // For custom messages, create a simple template
      renderedTemplate = {
        subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
        text: `${customMessage}\n\n---\nTicket Number: ${variables.ticketNumber}\nSupport Team: ${variables.companyName}`,
        html: `<p>${customMessage.replace(/\n/g, '<br>')}</p><hr><p><strong>Ticket Number:</strong> ${variables.ticketNumber}<br><strong>Support Team:</strong> ${variables.companyName}</p>`
      };
    } else {
      // Use the template system for auto-replies
      renderedTemplate = templateEngine.renderAutoReply(template, variables);
    }

    // Send email
    await transporter.sendMail({
      from: `"${variables.companyName} Support" <${mailbox.email}>`,
      to: toEmail,
      subject: renderedTemplate.subject,
      text: renderedTemplate.text,
      html: renderedTemplate.html
    });    logger.info('Auto-reply sent successfully', { 
      recipient: toEmail,
      templateId: customMessage ? 'custom-message' : template.id,
      templateName: customMessage ? 'Custom Reply' : template.name,
      isCustomMessage: !!customMessage
    });
    return true;
  } catch (error: any) {
    logger.error('Failed to send auto-reply:', { 
      error: error.message,
      recipient: toEmail,
      mailboxId: mailbox.id 
    });
    return false;  }
}

// Fallback function for when no template is available
async function sendFallbackAutoReply(mailbox: any, toEmail: string, subject: string, ticketNumber?: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: mailbox.smtpHost,
      port: mailbox.smtpPort,
      secure: mailbox.smtpSSL,
      auth: {
        user: mailbox.smtpUser,
        pass: mailbox.smtpPass,
      },
    });

    const companyName = mailbox.company?.name || 'Support';

    await transporter.sendMail({
      from: `"${companyName} Support" <${mailbox.email}>`,
      to: toEmail,
      subject: `Re: ${subject}`,
      text: `Thank you for contacting ${companyName} support. Your ticket number is # ${ticketNumber}\n\nWe have received your inquiry and created a support ticket. Our team will get back to you as soon as possible.\n\nThis is an automated response, please do not reply directly to this email.`,
      html: `
        <p>Thank you for contacting ${companyName} support. Your ticket number is <strong># ${ticketNumber}</strong></p>
        <p>We have received your inquiry and created a support ticket. Our team will get back to you as soon as possible.</p>
        <p><em>This is an automated response, please do not reply directly to this email.</em></p>
      `
    });

    logger.info('Fallback auto-reply sent successfully', { recipient: toEmail });
    return true;
  } catch (error: any) {
    logger.error('Failed to send fallback auto-reply:', { 
      error: error.message,
      recipient: toEmail,
      mailboxId: mailbox.id 
    });
    return false;
  }
}

// Function to sync all active mailboxes
export async function syncAllMailboxes() {
  try {
    logger.info('Starting synchronization of all mailboxes');
    
    // Get all active mailboxes
    const mailboxes = await prisma.mailbox.findMany({
      where: { isActive: true }
    });

    logger.info(`Found ${mailboxes.length} active mailboxes to sync`);

    const results = [];
    for (const mailbox of mailboxes) {
      const result = await syncMailbox(mailbox.id);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    
    logger.info('Completed synchronization of all mailboxes', {
      totalMailboxes: mailboxes.length,
      successCount,
      errorCount
    });

    return { success: true, results };
  } catch (error: any) {
    logger.error('Error syncing all mailboxes:', { 
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}
