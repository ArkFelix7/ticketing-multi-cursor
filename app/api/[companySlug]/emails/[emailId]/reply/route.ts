import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAutoReply } from '@/lib/mailbox-sync';

export async function POST(
  request: NextRequest,
  { params }: { params: { companySlug: string; emailId: string } }
) {
  try {
    const { companySlug, emailId } = await Promise.resolve(params);
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { 
        id: true,
        name: true,
        ticketIdPrefix: true,
        ownerId: true
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get the email
    const email = await prisma.email.findFirst({
      where: {
        id: emailId,
        companyId: company.id,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Get the mailbox for sending the reply
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: email.mailboxId,
        companyId: company.id,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!mailbox) {
      return NextResponse.json({ error: 'Active mailbox not found for this email' }, { status: 404 });
    }

    // Check if ticket already exists for this email
    let ticket = null;
    if (email.isProcessed) {
      ticket = await prisma.ticket.findFirst({
        where: {
          emailId: email.id,
        },
        include: {
          assignee: true,
        },
      });
    }

    // If no ticket exists, create one first
    if (!ticket) {
      // Get system user for ticket creation
      const systemUser = await prisma.user.findUnique({
        where: { id: 'system' },
      });

      if (!systemUser) {
        return NextResponse.json({ 
          error: 'System user not found. Please contact administrator.' 
        }, { status: 500 });
      }

      // Generate ticket number
      const lastTicket = await prisma.ticket.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
      });

      const ticketNumber = lastTicket 
        ? parseInt(lastTicket.ticketNumber) + 1 
        : 1;

      // Create the ticket
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: ticketNumber.toString(),
          subject: email.subject || '(No subject)',
          description: email.body || email.bodyPlain || 'Email converted to ticket',
          status: 'open',
          priority: 'medium',
          companyId: company.id,
          creatorId: systemUser.id,
          emailId: email.id,
        },
        include: {
          assignee: true,
        },
      });

      // Mark email as processed
      await prisma.email.update({
        where: { id: email.id },
        data: { isProcessed: true },
      });
    }

    // Send the custom reply using the auto-reply system with custom message
    const replySubject = email.subject?.startsWith('Re:') 
      ? email.subject 
      : `Re: ${email.subject || '(No subject)'}`;

    const success = await sendAutoReply(
      mailbox, 
      email.fromEmail, 
      replySubject, 
      `${company.ticketIdPrefix || 'TCK'}-${ticket.ticketNumber}`,
      ticket,
      message.trim() // Custom message for the reply
    );

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to send reply email' 
      }, { status: 500 });
    }

    // Create a ticket comment for the custom reply
    await prisma.ticketComment.create({
      data: {
        content: `Custom reply sent to customer:\n\n${message.trim()}`,
        ticketId: ticket.id,
        userId: company.ownerId, // Use company owner as fallback for user ID
        isInternal: false,
      },
    });

    return NextResponse.json({ 
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: `${company.ticketIdPrefix || 'TCK'}-${ticket.ticketNumber}`,
        subject: ticket.subject,
      },
      message: 'Reply sent successfully'
    });

  } catch (error) {
    console.error('Error sending email reply:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
