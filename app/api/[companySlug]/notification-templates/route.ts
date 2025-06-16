import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_NOTIFICATION_VARIABLES } from '@/lib/notification-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get all notification templates for the company
    const templates = await prisma.notificationTemplate.findMany({
      where: { companyId: company.id },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ 
      templates,
      availableVariables: DEFAULT_NOTIFICATION_VARIABLES
    });

  } catch (error: any) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    const body = await request.json();

    const { name, subject, bodyText, bodyHtml, isDefault, isActive, variables } = body;

    // Validation
    if (!name || !subject || !bodyText) {
      return NextResponse.json({ 
        error: 'Name, subject, and bodyText are required' 
      }, { status: 400 });
    }

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // If setting this as default, unset other defaults first
    if (isDefault) {
      await prisma.notificationTemplate.updateMany({
        where: { 
          companyId: company.id,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    // Create the template
    const template = await prisma.notificationTemplate.create({
      data: {
        name,
        subject,
        bodyText,
        bodyHtml: bodyHtml || bodyText, // Use bodyText as fallback for HTML
        isDefault: Boolean(isDefault),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        variables: variables || DEFAULT_NOTIFICATION_VARIABLES,
        companyId: company.id
      }
    });

    return NextResponse.json({ 
      success: true,
      template 
    });

  } catch (error: any) {
    console.error('Error creating notification template:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A template with this name already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
