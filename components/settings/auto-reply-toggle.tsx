import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface AutoReplyToggleProps {
  companyId: string;
  companySlug: string;
  autoRepliesEnabled: boolean;
  onUpdate: (enabled: boolean) => void;
}

export function AutoReplyToggle({ 
  companyId, 
  companySlug, 
  autoRepliesEnabled, 
  onUpdate 
}: AutoReplyToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleAutoReplies = async () => {
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          autoRepliesEnabled: !autoRepliesEnabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.company.autoRepliesEnabled);
        
        toast({
          title: "Settings Updated",
          description: `Auto-replies ${data.company.autoRepliesEnabled ? 'enabled' : 'disabled'}`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Update Failed",
          description: errorData.error || "Failed to update auto-reply settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating auto-reply settings:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Auto-Reply Mode
              <Badge variant={autoRepliesEnabled ? "default" : "secondary"}>
                {autoRepliesEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {autoRepliesEnabled 
                ? "All incoming emails are automatically converted to tickets and auto-replies are sent"
                : "Emails remain in the inbox until manually converted to tickets"
              }
            </CardDescription>
          </div>
          <Button
            onClick={toggleAutoReplies}
            disabled={isUpdating}
            variant={autoRepliesEnabled ? "destructive" : "default"}
          >
            {isUpdating 
              ? "Updating..." 
              : autoRepliesEnabled 
                ? "Disable Auto-Replies" 
                : "Enable Auto-Replies"
            }
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-0">Automatic Mode:</span>
            <span>All emails → tickets + auto-replies sent immediately</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-0">Manual Mode:</span>
            <span>Emails remain in inbox → convert to tickets manually + auto-reply sent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
