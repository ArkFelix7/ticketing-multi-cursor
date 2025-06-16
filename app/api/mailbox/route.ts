import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { testImap, testSmtp } from '@/lib/mailbox-test';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, provider, protocol, imapHost, imapPort, imapUser, imapPass, imapSSL, smtpHost, smtpPort, smtpUser, smtpPass, smtpSSL, companySlug } = data;
    if (!companySlug || !name || !email || !provider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Find company by slug
    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    // Test IMAP/SMTP connection before saving
    const imapResult = await testImap({ imapHost, imapPort, imapUser, imapPass, imapSSL });
    if (!imapResult.success) {
      return NextResponse.json({ error: 'IMAP: ' + imapResult.error }, { status: 400 });
    }
    const smtpResult = await testSmtp({ smtpHost, smtpPort, smtpUser, smtpPass, smtpSSL });
    if (!smtpResult.success) {
      return NextResponse.json({ error: 'SMTP: ' + smtpResult.error }, { status: 400 });
    }
    // Create mailbox using Prisma
    const mailbox = await prisma.mailbox.create({
      data: {
        name,
        email,
        provider,
        protocol,
        imapHost,
        imapPort: imapPort ? parseInt(imapPort, 10) : null,
        imapUser,
        imapPass,
        imapSSL,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser,
        smtpPass,
        smtpSSL,
        companyId: company.id,
        isActive: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ mailbox });
  } catch (error: any) {
    console.error('Error creating mailbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('companySlug');
    if (!companySlug) {
      return NextResponse.json({ error: 'Company slug is required' }, { status: 400 });
    }
    // Find company by slug
    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const mailboxes = await prisma.mailbox.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ mailboxes });
  } catch (error: any) {
    console.error('Error fetching mailboxes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
