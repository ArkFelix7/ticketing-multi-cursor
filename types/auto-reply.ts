export interface AutoReplyTemplate {
  id: string;
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  isDefault: boolean;
  isActive: boolean;
  variables?: Record<string, string>;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoReplyVariables {
  companyName: string;
  ticketNumber: string;
  ticketPrefix: string;
  subject: string;
  customerName?: string;
  customerEmail: string;
  supportEmail: string;
  assigneeName?: string;
  priority: string;
  status: string;
  createdAt: string;
  currentDate: string;
  currentTime: string;
}

export interface CreateAutoReplyTemplateData {
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  isDefault?: boolean;
  isActive?: boolean;
  variables?: Record<string, string>;
}

export interface UpdateAutoReplyTemplateData extends Partial<CreateAutoReplyTemplateData> {
  id: string;
}

export const DEFAULT_AUTO_REPLY_VARIABLES: Record<keyof AutoReplyVariables, string> = {
  companyName: 'The name of your company',
  ticketNumber: 'The unique ticket number (e.g., TCK-001)',
  ticketPrefix: 'The ticket prefix used by your company',
  subject: 'The original subject line from the customer email',
  customerName: 'The name of the customer (if available)',
  customerEmail: 'The email address of the customer',
  supportEmail: 'Your support email address',
  assigneeName: 'The name of the assigned agent (if any)',
  priority: 'The priority level of the ticket',
  status: 'The current status of the ticket',
  createdAt: 'The date and time the ticket was created',
  currentDate: 'The current date',
  currentTime: 'The current time'
};

export const DEFAULT_TEMPLATE_TEXT = `Thank you for contacting {{companyName}} support. Your ticket number is {{ticketNumber}}.

We have received your inquiry and created a support ticket. Our team will get back to you as soon as possible.

Ticket Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{subject}}
- Created: {{createdAt}}
- Priority: {{priority}}

This is an automated response, please do not reply directly to this email.

Best regards,
{{companyName}} Support Team`;

export const DEFAULT_TEMPLATE_HTML = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
    Thank you for contacting {{companyName}} support
  </h2>
  
  <p>Your ticket number is <strong style="color: #007bff;">{{ticketNumber}}</strong></p>
  
  <p>We have received your inquiry and created a support ticket. Our team will get back to you as soon as possible.</p>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #495057;">Ticket Details:</h3>
    <ul style="margin-bottom: 0;">
      <li><strong>Ticket Number:</strong> {{ticketNumber}}</li>
      <li><strong>Subject:</strong> {{subject}}</li>
      <li><strong>Created:</strong> {{createdAt}}</li>
      <li><strong>Priority:</strong> {{priority}}</li>
    </ul>
  </div>
  
  <p style="color: #6c757d; font-style: italic; font-size: 14px;">
    This is an automated response, please do not reply directly to this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
  
  <p style="margin-bottom: 0;">
    Best regards,<br>
    <strong>{{companyName}} Support Team</strong>
  </p>
</div>`;
