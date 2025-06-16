import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Email {
  id: string;
  messageId: string;
  subject: string;
  fromEmail: string;
  fromName?: string;
  body: string;
  bodyHtml?: string;
  receivedAt: string;
  isProcessed: boolean;
}

interface EmailListProps {
  companySlug: string;
}

export function EmailList({ companySlug }: EmailListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingEmails, setConvertingEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEmails();
  }, [companySlug]);

  const fetchEmails = async () => {
    try {
      const response = await fetch(`/api/${companySlug}/emails?unprocessed=true`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      } else {
        console.error('Failed to fetch emails');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToTicket = async (emailId: string) => {
    setConvertingEmails(prev => new Set(prev).add(emailId));
    
    try {
      const response = await fetch(`/api/${companySlug}/emails/${emailId}/convert-to-ticket`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Email Converted",
          description: `Email converted to ticket ${data.ticket.ticketNumber} and auto-reply sent`,
        });
        
        // Remove the email from the list since it's now processed
        setEmails(prev => prev.filter(email => email.id !== emailId));
      } else {
        const errorData = await response.json();
        toast({
          title: "Conversion Failed",
          description: errorData.error || "Failed to convert email to ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error converting email to ticket:', error);
      toast({
        title: "Error",
        description: "An error occurred while converting the email",
        variant: "destructive",
      });
    } finally {
      setConvertingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading emails...</div>;
  }

  if (emails.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No unprocessed emails found. All emails have been converted to tickets or auto-replies are enabled.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Unprocessed Emails</h3>
        <Badge variant="secondary">{emails.length} emails</Badge>
      </div>
      
      {emails.map((email) => (
        <Card key={email.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{email.subject || '(No Subject)'}</CardTitle>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              From: {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm line-clamp-3">
                {email.body.substring(0, 200)}
                {email.body.length > 200 && '...'}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => convertToTicket(email.id)}
                disabled={convertingEmails.has(email.id)}
              >
                {convertingEmails.has(email.id) ? 'Converting...' : 'Convert to Ticket'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
