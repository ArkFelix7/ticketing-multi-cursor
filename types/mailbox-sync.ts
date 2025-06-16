// This file explicitly exports a type-safe version of the mailbox sync functions
import type { Mailbox } from '@prisma/client';

/**
 * Mailbox sync status options
 */
export type MailboxSyncStatus = 'active' | 'error' | 'inactive';

/**
 * Result of syncing a single mailbox
 */
export interface SyncMailboxResult {
  success: boolean;
  mailboxId: string | null;
  message?: string;
  error?: string;
  processedCount?: number;
  newTickets?: string[]; // Array of ticket IDs created
  emailIds?: string[]; // Array of email IDs processed
}

/**
 * Result of syncing all mailboxes
 */
export interface SyncAllMailboxesResult {
  success: boolean;
  results?: SyncMailboxResult[];
  error?: string;
  totalProcessed?: number;
  totalErrors?: number;
  completedAt?: string;
}

/**
 * Request type for mailbox sync API
 */
export interface MailboxSyncRequest {
  mailboxId?: string; // Optional - if provided, only sync this mailbox
  force?: boolean;    // Optional - if true, sync even inactive mailboxes
}

/**
 * Extended mailbox type with additional fields
 */
export interface ExtendedMailbox extends Mailbox {
  company?: {
    id: string;
    name: string;
    slug: string;
    ticketIdPrefix?: string;
  };
  _count?: {
    emails: number;
    tickets: number;
  };
  lastError?: string | null;
}

// Type definitions for email-related functionality
export interface ParsedEmail {
  messageId: string;
  from?: {
    value: Array<{
      address: string;
      name?: string;
    }>;
  };
  to?: {
    value: Array<{
      address: string;
      name?: string;
    }>;
  };
  cc?: {
    value: Array<{
      address: string;
      name?: string;
    }>;
  };
  bcc?: {
    value: Array<{
      address: string;
      name?: string;
    }>;
  };
  subject?: string;
  text?: string;
  html?: string;
  date?: Date;
  headerLines: Array<{
    key: string;
    line: string;
  }>;
}
