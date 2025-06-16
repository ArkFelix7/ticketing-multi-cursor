import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    const url = new URL(request.url);
    const unprocessedOnly = url.searchParams.get('unprocessed') === 'true';

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Build the where clause
    const whereClause: any = {
      companyId: company.id
    };

    if (unprocessedOnly) {
      whereClause.isProcessed = false;
    }

    // Fetch emails
    const emails = await prisma.email.findMany({
      where: whereClause,
      orderBy: {
        receivedAt: 'desc'
      },
      take: 50, // Limit to 50 emails for performance
      select: {
        id: true,
        messageId: true,
        subject: true,
        fromEmail: true,
        fromName: true,
        body: true,
        bodyHtml: true,
        receivedAt: true,
        isProcessed: true,
        tickets: {
          select: {
            id: true,
            ticketNumber: true
          }
        }
      }
    });

    return NextResponse.json({ emails });

  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
