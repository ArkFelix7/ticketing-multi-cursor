export interface Email {
  id: string;
  companyId: string;
  messageId: string; // MIME Message-ID header
  subject: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string[];
  ccEmail: string[];
  bccEmail: string[];
  body: string;
  bodyPlain?: string; // plain text version
  bodyHtml?: string; // HTML version
  receivedAt: string;
  headers: Record<string, string>; // All email headers
  attachments?: EmailAttachment[]; // Make optional
  references?: string[]; // References header for threading
  inReplyTo?: string; // In-Reply-To header
  rawMimeContent: string; // Raw MIME content for storage
  mailboxId: string; // ID of mailbox that received this
  isProcessed: boolean; // Whether this email has been processed

  // Computed fields added by the API
  hasTicket?: boolean; // Indicates if a ticket has been created for this email
  ticketId?: string; // The ID of the associated ticket
  tickets?: { id: string }[]; // Array of related tickets
}

export interface EmailAttachment {
  id: string;
  emailId: string;
  filename: string;
  contentType: string;
  size: number; // in bytes
  content: string; // Base64 encoded
  isInline: boolean;
  contentId?: string; // Content-ID for inline attachments
}

export interface Mailbox {
  id: string;
  companyId: string;
  name: string;
  email: string;
  provider: string; // "gmail" | "outlook" | "other"
  protocol: string; // "imap", "smtp"
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPass?: string;
  imapSSL?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSSL?: boolean;
  oauth?: any;
  isActive: boolean;
  status?: string;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}