/**
 * Utility functions for working with emails
 */

import { Email } from "@/types/email";
import DOMPurify from 'isomorphic-dompurify';

/**
 * Safely access email properties that might be undefined
 */
export const EmailUtils = {
  /**
   * Get a safe array of recipients, ensuring we always return a valid array
   */
  getRecipients(email: Email | null | undefined): string[] {
    return email?.toEmail || [];
  },
  
  /**
   * Get a safe array of CC recipients, ensuring we always return a valid array
   */
  getCcRecipients(email: Email | null | undefined): string[] {
    return email?.ccEmail || [];
  },
  
  /**
   * Get a safe array of BCC recipients, ensuring we always return a valid array
   */
  getBccRecipients(email: Email | null | undefined): string[] {
    return email?.bccEmail || [];
  },
  
  /**
   * Get a safe array of attachments, ensuring we always return a valid array
   */
  getAttachments(email: Email | null | undefined): any[] {
    return email?.attachments || [];
  },
  
  /**
   * Format an email for display (name <email>)
   */
  formatEmailAddress(email: string, name?: string): string {
    if (name) {
      return `${name} <${email}>`;
    }
    return email;
  },

  /**
   * Sanitize HTML to prevent XSS attacks
   */
  sanitizeHtml(html: string | null | undefined): string {
    if (!html) return '';
    // Use DOMPurify to sanitize HTML content
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote', 'br', 
        'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 
        'dt', 'em', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 
        'hr', 'i', 'img', 'ins', 'kbd', 'li', 'main', 'mark', 'nav', 'ol', 'p', 'picture', 'pre', 'q', 's', 
        'samp', 'section', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 
        'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
      ],
      ALLOWED_ATTR: [
        'alt', 'class', 'color', 'colspan', 'controls', 'dir', 'download', 'href', 'id', 'lang', 
        'loop', 'muted', 'poster', 'preload', 'rel', 'rowspan', 'scope', 'span', 'src', 'start', 
        'style', 'target', 'title', 'translate', 'type'
      ],
      FORBID_ATTR: [
        'on*', 'formaction', 'xlink:href', 'data-*'
      ],
      // Additional safeguards
      ADD_URI_SAFE_ATTR: ['target'],
      KEEP_CONTENT: true,
      FORCE_BODY: true
    });
  },

  /**
   * Get sanitized HTML content from an email
   */
  getSafeHtml(email: Email | null | undefined): string {
    if (!email?.bodyHtml) return '';
    return this.sanitizeHtml(email.bodyHtml);
  }
};
