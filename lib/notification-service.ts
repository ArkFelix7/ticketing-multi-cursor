import { prisma } from './prisma';
import nodemailer from 'nodemailer';

export interface NotificationEmailOptions {
  to: string;
  originalSubject: string;
  ticketNumber: string;
  companyId: string;
  ticketData: {
    id: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: Date;
    customerName?: string;
    customerEmail: string;
    assignee?: {
      displayName: string;
      email: string;
    } | null;
  };
  customMessage?: string;
}

export async function sendNotificationEmail(options: NotificationEmailOptions) {
  try {
    // Get company details and notification settings
    const company = await prisma.company.findUnique({
      where: { id: options.companyId },
      include: {
        notificationTemplates: {
          where: {
            isActive: true,
            isDefault: true
          }
        },
        mailboxes: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Check if notifications are enabled
    if (!company.notificationsEnabled) {
      console.log('Notifications disabled for company:', company.name);
      return { success: true, message: 'Notifications disabled' };
    }

    // Get the default notification template
    const template = company.notificationTemplates.find(t => t.isDefault) || 
                    company.notificationTemplates[0];

    if (!template) {
      console.log('No notification template found for company:', company.name);
      return { success: false, message: 'No notification template configured' };
    }

    // Get the first active mailbox for sending
    const mailbox = company.mailboxes[0];
    if (!mailbox) {
      throw new Error('No active mailbox found for sending notifications');
    }

    // Create subject with ticket number prefix
    const subject = `[${options.ticketNumber}] ${options.originalSubject}`;

    // Replace template variables
    const templateVars = {
      ticketNumber: options.ticketNumber,
      originalSubject: options.originalSubject,
      customerName: options.ticketData.customerName || options.ticketData.customerEmail,
      customerEmail: options.ticketData.customerEmail,
      priority: options.ticketData.priority,
      status: options.ticketData.status,
      createdAt: options.ticketData.createdAt.toLocaleDateString(),
      assigneeName: options.ticketData.assignee?.displayName || 'Unassigned',
      assigneeEmail: options.ticketData.assignee?.email || '',
      companyName: company.name,
      supportEmail: company.supportEmail || mailbox.email,
      customMessage: options.customMessage || ''
    };

    // Replace variables in templates
    let bodyText = template.bodyText;
    let bodyHtml = template.bodyHtml;
    let emailSubject = template.subject || subject;

    Object.entries(templateVars).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      bodyText = bodyText.replace(new RegExp(placeholder, 'g'), String(value));
      bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), String(value));
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Ensure subject has ticket number prefix if not already present
    if (!emailSubject.includes(`[${options.ticketNumber}]`)) {
      emailSubject = `[${options.ticketNumber}] ${emailSubject}`;
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransporter({
      host: mailbox.smtpHost,
      port: mailbox.smtpPort || 587,
      secure: mailbox.smtpSSL,
      auth: {
        user: mailbox.smtpUser,
        pass: mailbox.smtpPass,
      },
    });

    // Send the notification email
    const mailOptions = {
      from: `${company.name} Support <${mailbox.email}>`,
      to: options.to,
      subject: emailSubject,
      text: bodyText,
      html: bodyHtml,
      headers: {
        'X-Ticket-Number': options.ticketNumber,
        'X-Ticket-ID': options.ticketData.id,
        'X-Notification-Type': 'ticket-notification'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('Notification email sent:', {
      to: options.to,
      subject: emailSubject,
      ticketNumber: options.ticketNumber,
      messageId: result.messageId
    });

    return {
      success: true,
      messageId: result.messageId,
      subject: emailSubject
    };

  } catch (error) {
    console.error('Error sending notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Default notification template variables that can be used in templates
export const DEFAULT_NOTIFICATION_VARIABLES = {
  ticketNumber: 'The ticket number (e.g., TCK-001)',
  originalSubject: 'The original email subject',
  customerName: 'Customer name or email if name not available',
  customerEmail: 'Customer email address',
  priority: 'Ticket priority (low, medium, high, urgent)',
  status: 'Ticket status (open, pending, in-progress, closed)',
  createdAt: 'Ticket creation date',
  assigneeName: 'Assigned agent name or "Unassigned"',
  assigneeEmail: 'Assigned agent email',
  companyName: 'Company name',
  supportEmail: 'Support email address',
  customMessage: 'Custom message (when provided)'
};
