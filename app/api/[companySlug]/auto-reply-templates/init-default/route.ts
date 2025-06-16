import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  DEFAULT_TEMPLATE_TEXT, 
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_AUTO_REPLY_VARIABLES 
} from '@/types/auto-reply';

export async function POST(
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

    // Check if templates already exist
    const existingTemplates = await prisma.autoReplyTemplate.count({
      where: { companyId: company.id }
    });

    if (existingTemplates > 0) {
      return NextResponse.json({ 
        error: 'Templates already exist for this company' 
      }, { status: 409 });
    }

    // Create default template
    const defaultTemplate = await prisma.autoReplyTemplate.create({
      data: {
        name: 'Default Auto-Reply',
        subject: 'Re: {{subject}}',
        bodyText: DEFAULT_TEMPLATE_TEXT,
        bodyHtml: DEFAULT_TEMPLATE_HTML,
        isDefault: true,
        isActive: true,
        variables: DEFAULT_AUTO_REPLY_VARIABLES,
        companyId: company.id
      }
    });

    return NextResponse.json({ 
      message: 'Default template created successfully',
      template: defaultTemplate 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating default auto-reply template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
