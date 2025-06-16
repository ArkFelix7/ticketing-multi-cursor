   import { User } from './user';

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g., TCK-0001
  companyId: string;
  subject: string;
  status: 'open' | 'in-progress' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  creatorId: string;
  creator?: User;
  assigneeId?: string;
  assignee?: User;
  emailId?: string;
  email?: {
    id: string;
    fromEmail: string;
    fromName?: string;
    subject: string;
  };
  messages?: TicketMessage[];
  responses?: TicketResponse[]; // Legacy field for backwards compatibility
  _count?: {
    comments?: number;
  };
  // Computed fields for backwards compatibility
  requesterName?: string;
  requesterEmail?: string;
  customerEmail?: string;
  customerName?: string;
  commentsCount?: number;
}

export interface TicketMessage {
  id: string;
  body: string;
  bodyHtml?: string;
  createdAt: string;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  isInternal: boolean;
  ticketId: string;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
}

// Legacy interface for backwards compatibility
export interface TicketResponse {
  id: string;
  ticketId: string;
  content: string;
  contentType: 'text' | 'html';
  isPublic: boolean; // whether visible to requester
  createdAt: string;
  authorId?: string; // null for customer replies
  author?: User;
  emailMessageId?: string;
}