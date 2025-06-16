import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTicketId } from '@/lib/utils';
import { sendAutoReply } from '@/lib/mailbox-sync';
import { sendNotificationEmail } from '@/lib/notification-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { companySlug: string; emailId: string } }
) {
  try {
    const { companySlug, emailId } = await Promise.resolve(params);

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { 
        id: true,
        ticketIdPrefix: true,
        ownerId: true
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Find the email
    const email = await prisma.email.findUnique({
      where: { 
        id: emailId,
        companyId: company.id
      },
      include: {
        mailbox: true,
        tickets: true
      }
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Check if email is already converted to ticket
    if (email.isProcessed || email.tickets.length > 0) {
      return NextResponse.json({ 
        error: 'Email has already been converted to a ticket',
        ticket: email.tickets[0]
      }, { status: 400 });
    }

    // Generate ticket number
    const prefix = company.ticketIdPrefix || 'TCK';
    const ticketCount = await prisma.ticket.count({
      where: { companyId: company.id }
    });
    const nextNumber = ticketCount + 1;
    const ticketNumber = generateTicketId(prefix, nextNumber);

    // Try to get system user first, if not available use company owner as fallback
    const systemUser = await prisma.user.findUnique({
      where: { id: 'system' }
    });

    const creatorId = systemUser ? 'system' : company.ownerId;

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: email.subject,
        status: 'open',
        priority: 'medium',
        creatorId,
        companyId: company.id,
        emailId: email.id,
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
    });    // Send auto-reply for manual conversion
    try {
      await sendAutoReply(
        email.mailbox, 
        email.fromEmail, 
        email.subject, 
        ticket.ticketNumber,
        ticket
      );
    } catch (autoReplyError) {
      console.error('Failed to send auto-reply for manual conversion:', autoReplyError);
      // Don't fail the ticket creation if auto-reply fails
    }

    // Send notification email for manual conversion
    try {
      await sendNotificationEmail({
        to: email.fromEmail,
        originalSubject: email.subject,
        ticketNumber: ticket.ticketNumber,
        companyId: company.id,
        ticketData: {
          id: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          customerName: email.fromName,
          customerEmail: email.fromEmail,
          assignee: null
        }
      });
    } catch (notificationError) {
      console.error('Failed to send notification email for manual conversion:', notificationError);
      // Don't fail the ticket creation if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      ticket,
      message: 'Email converted to ticket and auto-reply sent'
    });

  } catch (error: any) {
    console.error('Error converting email to ticket:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
