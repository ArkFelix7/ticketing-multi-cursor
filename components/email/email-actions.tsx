import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Email } from '@/types/email';

interface EmailActionsProps {
  email: Email;
  companySlug: string;
  onEmailUpdate: () => void;
}

export function EmailActions({ email, companySlug, onEmailUpdate }: EmailActionsProps) {
  const [convertingToTicket, setConvertingToTicket] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const convertToTicket = async () => {
    setConvertingToTicket(true);
    
    try {
      const response = await fetch(`/api/${companySlug}/emails/${email.id}/convert-to-ticket`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Email Converted",
          description: `Email converted to ticket ${data.ticket.ticketNumber} and auto-reply sent`,
        });
        
        onEmailUpdate(); // Refresh the email list
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
      setConvertingToTicket(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }

    setSendingReply(true);
    
    try {
      // First, convert to ticket if not already converted
      if (!email.hasTicket) {
        await convertToTicket();
        onEmailUpdate(); // Refresh to get updated email with ticket info
      }
      
      // Then send the custom reply
      const response = await fetch(`/api/${companySlug}/emails/${email.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Reply Sent",
          description: "Your reply has been sent successfully",
        });
        
        setReplyMessage('');
        setReplyDialogOpen(false);
        onEmailUpdate(); // Refresh the email list
      } else {
        const errorData = await response.json();
        toast({
          title: "Reply Failed",
          description: errorData.error || "Failed to send reply",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending the reply",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  if (email.hasTicket && email.ticketId) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          ✅ Ticketed
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
          onClick={() => window.open(`/${companySlug}/tickets/${email.ticketId}`, '_blank')}
        >
          🎫 View Ticket →
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={convertToTicket}
        disabled={convertingToTicket}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {convertingToTicket ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Converting...
          </>
        ) : (
          <>
            🎫 Create Ticket
          </>
        )}
      </Button>
      
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="border-green-200 text-green-600 hover:bg-green-50"
          >
            📧 Reply
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Email</DialogTitle>
            <DialogDescription>
              Send a reply to <strong>{email.fromName || email.fromEmail}</strong> regarding: 
              <em>"{email.subject || '(No subject)'}"</em>
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                This will {email.hasTicket ? 'add to the existing ticket' : 'create a new ticket and send a reply'}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="reply-message" className="text-sm font-medium">
                Your Reply Message
              </label>
              <Textarea
                id="reply-message"
                placeholder="Type your reply message here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={8}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your default company auto-reply template will be used as the base, with this message as the main content.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReplyDialogOpen(false)}
              disabled={sendingReply}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendReply}
              disabled={sendingReply || !replyMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendingReply ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Sending Reply...
                </>
              ) : (
                <>
                  📧 Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
