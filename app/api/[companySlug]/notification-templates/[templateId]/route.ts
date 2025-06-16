import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_NOTIFICATION_VARIABLES } from '@/lib/notification-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string; templateId: string } }
) {
  try {
    const { companySlug, templateId } = await Promise.resolve(params);

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get the specific notification template
    const template = await prisma.notificationTemplate.findUnique({
      where: { 
        id: templateId,
        companyId: company.id
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      template,
      availableVariables: DEFAULT_NOTIFICATION_VARIABLES
    });

  } catch (error: any) {
    console.error('Error fetching notification template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { companySlug: string; templateId: string } }
) {
  try {
    const { companySlug, templateId } = await Promise.resolve(params);
    const body = await request.json();

    const { name, subject, bodyText, bodyHtml, isDefault, isActive, variables } = body;

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if template exists
    const existingTemplate = await prisma.notificationTemplate.findUnique({
      where: { 
        id: templateId,
        companyId: company.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // If setting this as default, unset other defaults first
    if (isDefault && !existingTemplate.isDefault) {
      await prisma.notificationTemplate.updateMany({
        where: { 
          companyId: company.id,
          isDefault: true,
          id: { not: templateId }
        },
        data: { isDefault: false }
      });
    }

    // Update the template
    const template = await prisma.notificationTemplate.update({
      where: { id: templateId },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(bodyText && { bodyText }),
        ...(bodyHtml !== undefined && { bodyHtml }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(variables && { variables }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      template 
    });

  } catch (error: any) {
    console.error('Error updating notification template:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A template with this name already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { companySlug: string; templateId: string } }
) {
  try {
    const { companySlug, templateId } = await Promise.resolve(params);

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if template exists
    const template = await prisma.notificationTemplate.findUnique({
      where: { 
        id: templateId,
        companyId: company.id
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Don't allow deletion of the only default template
    if (template.isDefault) {
      const otherTemplates = await prisma.notificationTemplate.count({
        where: { 
          companyId: company.id,
          id: { not: templateId }
        }
      });

      if (otherTemplates === 0) {
        return NextResponse.json({ 
          error: 'Cannot delete the only template. Create another template first.' 
        }, { status: 400 });
      }

      // If deleting the default template and others exist, make another one default
      await prisma.notificationTemplate.updateMany({
        where: { 
          companyId: company.id,
          id: { not: templateId }
        },
        data: { isDefault: true },
        take: 1
      });
    }

    // Delete the template
    await prisma.notificationTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting notification template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
