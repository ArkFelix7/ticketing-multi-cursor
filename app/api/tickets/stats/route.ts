import { NextRequest, NextResponse } from 'next/server';
import prisma, { prismaWithRetry } from '@/lib/prisma';

// GET /api/tickets/stats - Fetch ticket count statistics by status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Use prismaWithRetry to handle connection issues automatically
    const [openCount, pendingCount, inProgressCount, closedCount] = await Promise.all([
      prismaWithRetry.query(() => prisma.ticket.count({
        where: { 
          companyId,
          status: 'open'
        }
      })),
      prismaWithRetry.query(() => prisma.ticket.count({
        where: { 
          companyId,
          status: 'pending'
        }
      })),
      prismaWithRetry.query(() => prisma.ticket.count({
        where: { 
          companyId, 
          status: 'in progress'
        }
      })),
      prismaWithRetry.query(() => prisma.ticket.count({
        where: { 
          companyId, 
          status: 'closed'
        }
      }))
    ]);

    return NextResponse.json({
      stats: {
        open: openCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        closed: closedCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching ticket stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
