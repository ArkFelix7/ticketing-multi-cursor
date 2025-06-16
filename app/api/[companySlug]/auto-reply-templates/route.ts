import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  CreateAutoReplyTemplateData, 
  DEFAULT_TEMPLATE_TEXT, 
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_AUTO_REPLY_VARIABLES 
} from '@/types/auto-reply';
import { templateEngine } from '@/lib/auto-reply-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get all auto-reply templates for the company
    const templates = await prisma.autoReplyTemplate.findMany({
      where: { companyId: company.id },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ templates });

  } catch (error) {
    console.error('Error fetching auto-reply templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    const body: CreateAutoReplyTemplateData = await request.json();

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Validate template syntax
    const subjectValidation = templateEngine.validateTemplate(body.subject);
    const textValidation = templateEngine.validateTemplate(body.bodyText);
    const htmlValidation = templateEngine.validateTemplate(body.bodyHtml);

    if (!subjectValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid subject template syntax', 
        details: subjectValidation.error 
      }, { status: 400 });
    }

    if (!textValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid text template syntax', 
        details: textValidation.error 
      }, { status: 400 });
    }

    if (!htmlValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid HTML template syntax', 
        details: htmlValidation.error 
      }, { status: 400 });
    }

    // If this is being set as default, unset other defaults
    if (body.isDefault) {
      await prisma.autoReplyTemplate.updateMany({
        where: { 
          companyId: company.id,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }

    // Create the template
    const template = await prisma.autoReplyTemplate.create({
      data: {
        name: body.name,
        subject: body.subject,
        bodyText: body.bodyText,
        bodyHtml: body.bodyHtml,
        isDefault: body.isDefault || false,
        isActive: body.isActive ?? true,
        variables: body.variables || DEFAULT_AUTO_REPLY_VARIABLES,
        companyId: company.id
      }
    });

    return NextResponse.json({ template }, { status: 201 });

  } catch (error) {
    console.error('Error creating auto-reply template:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: 'A template with this name already exists' 
      }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
