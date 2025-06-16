import Handlebars from 'handlebars';
import { format } from 'date-fns';
import { AutoReplyVariables, AutoReplyTemplate } from '@/types/auto-reply';

// Helper functions for Handlebars
Handlebars.registerHelper('formatDate', function(date: Date | string, formatStr: string = 'PPp') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
});

Handlebars.registerHelper('uppercase', function(str: string) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str ? str.toLowerCase() : '';
});

Handlebars.registerHelper('capitalize', function(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
});

export class AutoReplyTemplateEngine {
  private static instance: AutoReplyTemplateEngine;

  private constructor() {}

  public static getInstance(): AutoReplyTemplateEngine {
    if (!AutoReplyTemplateEngine.instance) {
      AutoReplyTemplateEngine.instance = new AutoReplyTemplateEngine();
    }
    return AutoReplyTemplateEngine.instance;
  }

  /**
   * Compile and render a template with provided variables
   */
  public renderTemplate(templateContent: string, variables: AutoReplyVariables): string {
    try {
      const template = Handlebars.compile(templateContent);
      return template(variables);
    } catch (error) {
      console.error('Template rendering error:', error);
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate template syntax
   */
  public validateTemplate(templateContent: string): { isValid: boolean; error?: string } {
    try {
      Handlebars.compile(templateContent);
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown template error' 
      };
    }
  }

  /**
   * Extract variables used in a template
   */
  public extractVariables(templateContent: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(templateContent)) !== null) {
      // Remove any Handlebars helpers and just get the variable name
      const variable = match[1].trim().split(' ')[0];
      if (variable && !variable.startsWith('#') && !variable.startsWith('/')) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * Create template variables object for rendering
   */
  public createTemplateVariables(data: {
    companyName: string;
    ticketNumber: string;
    ticketPrefix: string;
    subject: string;
    customerEmail: string;
    supportEmail: string;
    customerName?: string;
    assigneeName?: string;
    priority: string;
    status: string;
    createdAt: Date;
  }): AutoReplyVariables {
    const now = new Date();
    
    return {
      companyName: data.companyName,
      ticketNumber: data.ticketNumber,
      ticketPrefix: data.ticketPrefix,
      subject: data.subject,
      customerName: data.customerName || '',
      customerEmail: data.customerEmail,
      supportEmail: data.supportEmail,
      assigneeName: data.assigneeName || '',
      priority: data.priority,
      status: data.status,
      createdAt: format(data.createdAt, 'PPp'),
      currentDate: format(now, 'PP'),
      currentTime: format(now, 'p')
    };
  }

  /**
   * Render complete auto-reply email
   */
  public renderAutoReply(
    template: AutoReplyTemplate,
    variables: AutoReplyVariables
  ): { subject: string; text: string; html: string } {
    return {
      subject: this.renderTemplate(template.subject, variables),
      text: this.renderTemplate(template.bodyText, variables),
      html: this.renderTemplate(template.bodyHtml, variables)
    };
  }

  /**
   * Preview template with sample data
   */
  public previewTemplate(
    template: Pick<AutoReplyTemplate, 'subject' | 'bodyText' | 'bodyHtml'>,
    companyName: string = 'Your Company'
  ): { subject: string; text: string; html: string } {
    const sampleVariables: AutoReplyVariables = {
      companyName,
      ticketNumber: 'TCK-001',
      ticketPrefix: 'TCK',
      subject: 'Need help with account setup',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      supportEmail: 'support@yourcompany.com',
      assigneeName: 'Sarah Johnson',
      priority: 'Medium',
      status: 'Open',
      createdAt: format(new Date(), 'PPp'),
      currentDate: format(new Date(), 'PP'),
      currentTime: format(new Date(), 'p')
    };

    return this.renderAutoReply(template as AutoReplyTemplate, sampleVariables);
  }
}

export const templateEngine = AutoReplyTemplateEngine.getInstance();
