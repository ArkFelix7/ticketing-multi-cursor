import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateAutoReplyTemplateData } from '@/types/auto-reply';
import { templateEngine } from '@/lib/auto-reply-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string; templateId: string } }
) {
  try {
    const { companySlug, templateId } = await Promise.resolve(params);

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get the specific template
    const template = await prisma.autoReplyTemplate.findUnique({
      where: { 
        id: templateId,
        companyId: company.id 
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error fetching auto-reply template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { companySlug: string; templateId: string } }
) {
  try {
    const { companySlug, templateId } = await Promise.resolve(params);
    const body: Omit<UpdateAutoReplyTemplateData, 'id'> = await request.json();

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if template exists
    const existingTemplate = await prisma.autoReplyTemplate.findUnique({
      where: { 
        id: templateId,
        companyId: company.id 
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate template syntax if templates are being updated
    if (body.subject) {
      const validation = templateEngine.validateTemplate(body.subject);
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: 'Invalid subject template syntax', 
          details: validation.error 
        }, { status: 400 });
      }
    }

    if (body.bodyText) {
      const validation = templateEngine.validateTemplate(body.bodyText);
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: 'Invalid text template syntax', 
          details: validation.error 
        }, { status: 400 });
      }
    }

    if (body.bodyHtml) {
      const validation = templateEngine.validateTemplate(body.bodyHtml);
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: 'Invalid HTML template syntax', 
          details: validation.error 
        }, { status: 400 });
      }
    }

    // If this is being set as default, unset other defaults
    if (body.isDefault && !existingTemplate.isDefault) {
      await prisma.autoReplyTemplate.updateMany({
        where: { 
          companyId: company.id,
          isDefault: true,
          id: { not: templateId }
        },
        data: { isDefault: false }
      });
    }

    // Update the template
    const template = await prisma.autoReplyTemplate.update({
      where: { id: templateId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.subject && { subject: body.subject }),
        ...(body.bodyText && { bodyText: body.bodyText }),
        ...(body.bodyHtml && { bodyHtml: body.bodyHtml }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.variables && { variables: body.variables }),
      }
    });

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error updating auto-reply template:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: 'A template with this name already exists' 
      }, { status: 409 });
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
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if template exists
    const existingTemplate = await prisma.autoReplyTemplate.findUnique({
      where: { 
        id: templateId,
        companyId: company.id 
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Prevent deletion of the default template if it's the only one
    if (existingTemplate.isDefault) {
      const otherTemplates = await prisma.autoReplyTemplate.count({
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

      // If deleting the default template, set another one as default
      await prisma.autoReplyTemplate.updateMany({
        where: { 
          companyId: company.id,
          id: { not: templateId }
        },
        data: { isDefault: true },
        take: 1
      });
    }

    // Delete the template
    await prisma.autoReplyTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting auto-reply template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
