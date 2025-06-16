import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateTicketId } from '@/lib/utils';

// Helper function to generate a unique ticket number
async function generateUniqueTicketNumber(companyId: string): Promise<string> {
  // Get the company's ticket prefix
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { ticketIdPrefix: true }
  });
  
  const prefix = company?.ticketIdPrefix || 'TCK';
  
  // Count existing tickets for this company to determine next number
  const ticketCount = await prisma.ticket.count({
    where: { companyId }
  });
  
  // Generate ticket number with padding
  const nextNumber = ticketCount + 1;
  return generateTicketId(prefix, nextNumber);
}

// GET /api/tickets - Fetch tickets with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        companyId,
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
            photoURL: true
          }
        }
      }
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({}));
    const { companyId, emailId, creatorId, ...ticketData } = data;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    
    // Validate that the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // If no creatorId is provided, try to use system user first, then fall back to company owner
    let validCreatorId = creatorId;
    
    if (!validCreatorId) {
      // Try to get system user first
      const systemUser = await prisma.user.findUnique({
        where: { id: 'system' }
      });
      
      if (systemUser) {
        validCreatorId = 'system';
      } else {
        // Fall back to company owner
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { ownerId: true }
        });
        
        if (!company) {
          return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }
        
        if (!company.ownerId) {
          return NextResponse.json({ error: 'Company owner not found' }, { status: 400 });
        }
        
        validCreatorId = company.ownerId;
      }
    }

    // Verify that the creator exists
    const creatorExists = await prisma.user.findUnique({
      where: { id: validCreatorId }
    });
    
    if (!creatorExists) {
      return NextResponse.json({ 
        error: `Creator user with ID ${validCreatorId} not found` 
      }, { status: 400 });
    }

    // Generate a ticket number if not provided
    const ticketNumber = ticketData.ticketNumber || await generateUniqueTicketNumber(companyId);

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ...ticketData,
        ticketNumber,
        companyId,
        creatorId: validCreatorId,
        status: ticketData.status || 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // If emailId is provided, update the email to link it to the ticket
    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: { isProcessed: true }
      });
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}