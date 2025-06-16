import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEmailToTicketWithNotification() {
  try {
    console.log('Testing email to ticket conversion with notification...');
    
    // Find the aarya company
    const company = await prisma.company.findUnique({
      where: { slug: 'aarya' },
      include: {
        mailboxes: {
          where: { isActive: true },
          take: 1
        }
      }
    });
    
    if (!company) {
      console.log('❌ Company "aarya" not found');
      return;
    }
    
    if (company.mailboxes.length === 0) {
      console.log('❌ No active mailboxes found for company "aarya"');
      return;
    }
    
    console.log('✅ Found company:', company.name);
    console.log('✅ Found mailbox:', company.mailboxes[0].email);
    
    // Create a test email
    const testEmail = await prisma.email.create({
      data: {
        messageId: `test-${Date.now()}@example.com`,
        subject: 'Test notification email functionality',
        fromEmail: 'customer@example.com',
        fromName: 'Test Customer',
        toEmail: [company.mailboxes[0].email],
        ccEmail: [],
        bccEmail: [],
        body: 'This is a test email to verify that notification emails are working correctly.',
        bodyHtml: '<p>This is a test email to verify that notification emails are working correctly.</p>',
        mailboxId: company.mailboxes[0].id,
        companyId: company.id,
        rawMimeContent: 'Test MIME content',
        headers: {},
        isProcessed: false
      }
    });
    
    console.log('✅ Created test email:', testEmail.id);
    
    // Test the API endpoint to convert email to ticket
    const response = await fetch(`http://localhost:3000/api/aarya/emails/${testEmail.id}/convert-to-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Failed to convert email to ticket:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Email converted to ticket successfully:', result.ticket.ticketNumber);
    
    // Check if notification template exists
    const notificationTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        companyId: company.id,
        isActive: true,
        isDefault: true
      }
    });
    
    if (notificationTemplate) {
      console.log('✅ Found notification template:', notificationTemplate.name);
      console.log('Template subject:', notificationTemplate.subject);
    } else {
      console.log('❌ No notification template found');
    }
    
    console.log('\n🎉 Test completed! Check your email or logs for the notification email.');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailToTicketWithNotification();
