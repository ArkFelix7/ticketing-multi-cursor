import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { templateEngine } from '@/lib/auto-reply-templates';

export async function POST(
  request: NextRequest,
  { params }: { params: { companySlug: string } }
) {
  try {
    const { companySlug } = await Promise.resolve(params);
    const body = await request.json();
    const { subject, bodyText, bodyHtml } = body;

    // Find the company
    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Validate template syntax
    const subjectValidation = templateEngine.validateTemplate(subject);
    const textValidation = templateEngine.validateTemplate(bodyText);
    const htmlValidation = templateEngine.validateTemplate(bodyHtml);

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

    // Generate preview with sample data
    const preview = templateEngine.previewTemplate(
      { subject, bodyText, bodyHtml },
      company.name
    );

    // Extract variables used in the templates
    const subjectVariables = templateEngine.extractVariables(subject);
    const textVariables = templateEngine.extractVariables(bodyText);
    const htmlVariables = templateEngine.extractVariables(bodyHtml);
    
    const allVariables = [...new Set([...subjectVariables, ...textVariables, ...htmlVariables])];

    return NextResponse.json({ 
      preview,
      variables: allVariables,
      validation: {
        subject: subjectValidation,
        text: textValidation,
        html: htmlValidation
      }
    });

  } catch (error) {
    console.error('Error previewing auto-reply template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
