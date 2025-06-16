import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/companies/[companySlug]/emails
export async function GET(
  req: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await params;
    if (!companySlug) {
      return NextResponse.json({ error: "Missing companySlug" }, { status: 400 });
    }
    // Find company by slug
    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    // Fetch ALL emails for the company, including those with tickets
    const emails = await prisma.email.findMany({
      where: {
        companyId: company.id,
      },
      orderBy: { receivedAt: "desc" },
      take: 50,
      include: {
        tickets: { select: { id: true } },
      },
    });
    // Add a computed field 'hasTicket' for UI
    const emailsWithTicketStatus = emails.map((email) => ({
      ...email,
      hasTicket: Array.isArray(email.tickets) && email.tickets.length > 0,
      ticketId: Array.isArray(email.tickets) && email.tickets.length > 0 ? email.tickets[0].id : null,
    }));
    return NextResponse.json({ emails: emailsWithTicketStatus });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
