const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    // Create a test user
    const user = await prisma.user.upsert({
      where: { id: 'test-user-123' },
      update: {},
      create: {
        id: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin'
      }
    });

    console.log('Created user:', user);

    // Create a test company
    const company = await prisma.company.upsert({
      where: { slug: 'test-company' },
      update: {},
      create: {
        name: 'Test Company',
        slug: 'test-company',
        ownerId: user.id,
        supportEmail: 'support@test-company.com',
        ticketIdPrefix: 'TEST',
        autoRepliesEnabled: true
      }
    });

    console.log('Created company:', company);

    // Update user with company ID
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id }
    });

    console.log('Test data created successfully!');
    console.log('You can now test with:');
    console.log(`Company slug: ${company.slug}`);
    console.log(`User email: ${user.email}`);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
