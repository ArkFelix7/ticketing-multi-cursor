import prisma, { prismaWithRetry } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/companies/[companySlug]
export async function GET(
  request: Request,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    if (!companySlug) {
      return NextResponse.json({ error: 'Company slug is required' }, { status: 400 });
    }
    const company = await prismaWithRetry.query(() =>
      prisma.company.findUnique({
        where: { slug: companySlug },
      })
    );
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/companies/[companySlug]
export async function PATCH(
  request: Request,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    const data = await request.json();
    if (!companySlug) {
      return NextResponse.json({ error: 'Company slug is required' }, { status: 400 });
    }
    // Only allow updating certain fields
    const allowedFields = ['name', 'supportEmail', 'ticketIdPrefix', 'defaultCCs', 'settings'];
    const updateData = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {} as Record<string, any>);
    updateData.updatedAt = new Date();
    const company = await prisma.company.update({
      where: { slug: companySlug },
      data: updateData,
    });
    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
