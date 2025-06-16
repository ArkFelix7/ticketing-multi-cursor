import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_NOTIFICATION_TEMPLATE = {
  name: 'Default Notification',
  subject: '[{{ticketNumber}}] {{originalSubject}}',
  bodyText: `Hello {{customerName}},

We have received your message and created ticket #{{ticketNumber}} for your inquiry.

Original Subject: {{originalSubject}}
Priority: {{priority}}
Status: {{status}}
Created: {{createdAt}}

We will review your request and respond as soon as possible. You can reference this ticket number in any future communications regarding this matter.

Best regards,
{{companyName}} Support Team

---
This is an automated notification. Please do not reply to this email.`,
  bodyHtml: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #2563eb;">Ticket Created: {{ticketNumber}}</h2>
  
  <p>Hello <strong>{{customerName}}</strong>,</p>
  
  <p>We have received your message and created ticket <strong>#{{ticketNumber}}</strong> for your inquiry.</p>
  
  <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <p><strong>Original Subject:</strong> {{originalSubject}}</p>
    <p><strong>Priority:</strong> {{priority}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    <p><strong>Created:</strong> {{createdAt}}</p>
  </div>
  
  <p>We will review your request and respond as soon as possible. You can reference this ticket number in any future communications regarding this matter.</p>
  
  <p>Best regards,<br>
  <strong>{{companyName}} Support Team</strong></p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
  <p style="font-size: 12px; color: #6b7280;">
    This is an automated notification. Please do not reply to this email.
  </p>
</body>
</html>`,
  isDefault: true,
  isActive: true,
  variables: {
    ticketNumber: 'The ticket number (e.g., TCK-001)',
    originalSubject: 'The original email subject',
    customerName: 'Customer name or email if name not available',
    customerEmail: 'Customer email address',
    priority: 'Ticket priority (low, medium, high, urgent)',
    status: 'Ticket status (open, pending, in-progress, closed)',
    createdAt: 'Ticket creation date',
    assigneeName: 'Assigned agent name or "Unassigned"',
    assigneeEmail: 'Assigned agent email',
    companyName: 'Company name',
    supportEmail: 'Support email address',
    customMessage: 'Custom message (when provided)'
  }
};

async function createDefaultNotificationTemplates() {
  try {
    console.log('Creating default notification templates for existing companies...');
    
    // Get all companies that don't have notification templates
    const companies = await prisma.company.findMany({
      include: {
        notificationTemplates: true
      }
    });

    let createdCount = 0;

    for (const company of companies) {
      if (company.notificationTemplates.length === 0) {
        console.log(`Creating default notification template for company: ${company.name} (${company.slug})`);
        
        await prisma.notificationTemplate.create({
          data: {
            ...DEFAULT_NOTIFICATION_TEMPLATE,
            companyId: company.id
          }
        });
        
        createdCount++;
      } else {
        console.log(`Company ${company.name} already has notification templates, skipping...`);
      }
    }

    console.log(`\nCompleted! Created default notification templates for ${createdCount} companies.`);
    
    if (createdCount === 0) {
      console.log('All companies already have notification templates configured.');
    }

  } catch (error) {
    console.error('Error creating default notification templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDefaultNotificationTemplates();
