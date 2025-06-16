import { sendNotificationEmail } from '../lib/notification-service';

const testData = {
  to: 'aarya@example.com',
  originalSubject: 'Test support request',
  ticketNumber: 'TCK-001',
  companyId: 'clzb5m8r8000113yzixd95wlb', // aarya company ID
  ticketData: {
    id: 'test-ticket-id',
    subject: 'Test support request',
    priority: 'medium',
    status: 'open',
    createdAt: new Date(),
    customerName: 'Aarya Test',
    customerEmail: 'aarya@example.com',
    assignee: null
  }
};

async function testNotificationEmail() {
  try {
    console.log('Testing notification email functionality...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const result = await sendNotificationEmail(testData);
    
    console.log('\nNotification email result:', result);
    
    if (result.success) {
      console.log('✅ Notification email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Subject:', result.subject);
    } else {
      console.log('❌ Failed to send notification email');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing notification email:', error);
  }
}

testNotificationEmail();
