const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTickets() {
  try {
    console.log('Checking database connection...');
    
    // Check companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            tickets: true,
            users: true
          }
        }
      }
    });
    
    console.log('\nCompanies in database:');
    companies.forEach(company => {
      console.log(`- ${company.name} (${company.slug}): ${company._count.tickets} tickets, ${company._count.users} users`);
    });
    
    // Check total tickets
    const totalTickets = await prisma.ticket.count();
    console.log(`\nTotal tickets in database: ${totalTickets}`);
    
    if (totalTickets > 0) {
      const tickets = await prisma.ticket.findMany({
        take: 5,
        include: {
          creator: {
            select: {
              displayName: true,
              email: true
            }
          },
          company: {
            select: {
              name: true,
              slug: true
            }
          },
          email: {
            select: {
              fromEmail: true,
              fromName: true,
              subject: true
            }
          }
        }
      });
      
      console.log('\nSample tickets:');
      tickets.forEach(ticket => {
        console.log(`- ${ticket.ticketNumber}: ${ticket.subject} (${ticket.status}) - Company: ${ticket.company.slug}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTickets();
