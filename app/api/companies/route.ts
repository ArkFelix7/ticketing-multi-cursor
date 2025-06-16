import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { ownerId, name, slug, supportEmail } = await request.json();

    if (!ownerId || !name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if company slug exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      return NextResponse.json({ error: 'Company with this slug already exists' }, { status: 409 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        ownerId,
        supportEmail: supportEmail || null,
        ticketIdPrefix: name.substring(0, 3).toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          ticketIdPrefix: name.substring(0, 3).toUpperCase(),
        },
      },
    });

    // Update the user with company ID
    await prisma.user.update({
      where: { id: ownerId },
      data: { 
        companyId: company.id,
        role: 'admin',
      },
    });

    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}