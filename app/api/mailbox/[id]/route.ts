import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Need to await params in dynamic route handlers (Next.js requirement)
    const { id: mailboxId } = await Promise.resolve(params);
    
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: mailboxId },
    });
    
    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }
    
    return NextResponse.json({ mailbox });
  } catch (error: any) {
    console.error('Error fetching mailbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mailboxId = params.id;
    const data = await request.json();

    if (!mailboxId) {
      return NextResponse.json({ error: 'Mailbox ID is required' }, { status: 400 });
    }

    // Only allow updating certain fields
    const allowedFields = ['name', 'email', 'protocol', 'host', 'port', 'username', 'password', 'isActive', 'oauth'];
    const updateData = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {} as Record<string, any>);

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const mailbox = await prisma.mailbox.update({
      where: { id: mailboxId },
      data: updateData,
    });

    return NextResponse.json({ mailbox });
  } catch (error: any) {
    console.error('Error updating mailbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mailboxId = params.id;

    if (!mailboxId) {
      return NextResponse.json({ error: 'Mailbox ID is required' }, { status: 400 });
    }

    // Delete the mailbox
    await prisma.mailbox.delete({
      where: { id: mailboxId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting mailbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
