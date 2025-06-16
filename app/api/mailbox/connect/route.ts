   import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      email, 
      provider, 
      imapHost, 
      imapPort, 
      imapUser, 
      imapPass, 
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPass,
      companyId 
    } = await request.json()

    if (!name || !email || !provider || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create mailbox in database
    const mailbox = await prisma.mailbox.create({
      data: {
        name,
        email,
        provider,
        protocol: 'imap',
        imapHost,
        imapPort: parseInt(imapPort) || 993,
        imapUser,
        imapPass,
        smtpHost,
        smtpPort: parseInt(smtpPort) || 465,
        smtpUser,
        smtpPass,
        companyId,
        status: 'active'
      },
    })

    return NextResponse.json({ mailbox }, { status: 201 })
  } catch (error) {
    console.error('Error creating mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to create mailbox' },
      { status: 500 }
    )
  }
}