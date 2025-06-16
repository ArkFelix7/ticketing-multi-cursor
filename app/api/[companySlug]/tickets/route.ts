import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    const { searchParams } = new URL(request.url);
    
    // Optional query parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Build where condition
    const whereCondition: any = {
      companyId: company.id,
    };

    if (status) {
      whereCondition.status = status;
    }

    if (priority) {
      whereCondition.priority = priority;
    }

    if (assigneeId) {
      whereCondition.assigneeId = assigneeId;
    }

    if (search) {
      whereCondition.OR = [
        {
          subject: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          ticketNumber: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }    // Fetch tickets
    const tickets = await prisma.ticket.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        email: {
          select: {
            id: true,
            fromEmail: true,
            fromName: true,
            subject: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            attachments: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      ...(limit && { take: limit })
    });

    // Transform tickets to include computed fields for backwards compatibility
    const transformedTickets = tickets.map(ticket => ({
      ...ticket,
      ticketNumber: `${companySlug.toUpperCase()}-${ticket.ticketNumber}`,
      commentsCount: ticket._count.messages,
      customerEmail: ticket.email?.fromEmail || 'N/A',
      customerName: ticket.email?.fromName || ticket.email?.fromEmail || 'N/A',
      // Legacy fields for backwards compatibility
      requesterEmail: ticket.email?.fromEmail || 'N/A',
      requesterName: ticket.email?.fromName || ticket.email?.fromEmail || 'N/A',
      responses: ticket.messages?.map(message => ({
        id: message.id,
        ticketId: ticket.id,
        content: message.body,
        contentType: message.bodyHtml ? 'html' : 'text',
        isPublic: !message.isInternal,
        createdAt: message.createdAt.toISOString(),
        authorId: message.authorId,
        author: message.authorId ? undefined : { 
          id: message.authorId || '',
          displayName: message.authorName || '',
          email: message.authorEmail || ''
        }
      })) || []
    }));

    return NextResponse.json({ 
      tickets: transformedTickets,
      total: transformedTickets.length
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
