// Test the tickets API endpoint
async function testTicketsAPI() {
  try {
    console.log('Testing tickets API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/aarya/tickets');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`\nAPI Response:`);
    console.log(`- Status: ${response.status}`);
    console.log(`- Total tickets returned: ${data.tickets?.length || 0}`);
    console.log(`- Total count: ${data.total || 0}`);
    
    if (data.tickets && data.tickets.length > 0) {
      console.log('\nFirst ticket sample:');
      const firstTicket = data.tickets[0];
      console.log(`- ID: ${firstTicket.id}`);
      console.log(`- Ticket Number: ${firstTicket.ticketNumber}`);
      console.log(`- Subject: ${firstTicket.subject}`);
      console.log(`- Status: ${firstTicket.status}`);
      console.log(`- Priority: ${firstTicket.priority}`);
      console.log(`- Requester Name: ${firstTicket.requesterName || firstTicket.customerName || 'N/A'}`);
      console.log(`- Requester Email: ${firstTicket.requesterEmail || firstTicket.customerEmail || 'N/A'}`);
      console.log(`- Messages count: ${firstTicket.messages?.length || 0}`);
      console.log(`- Legacy responses count: ${firstTicket.responses?.length || 0}`);
      console.log(`- Created: ${new Date(firstTicket.createdAt).toLocaleDateString()}`);
      console.log(`- Updated: ${new Date(firstTicket.updatedAt).toLocaleDateString()}`);
    }
    
  } catch (error) {
    console.error('Error testing tickets API:', error);
  }
}

// Only run if this is a Node.js environment
if (typeof window === 'undefined') {
  testTicketsAPI();
}
