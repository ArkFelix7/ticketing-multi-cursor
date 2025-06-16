// components/mailbox-sync-scheduler.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';
import type { SyncAllMailboxesResult } from '@/types/mailbox-sync';
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface MailboxSyncSchedulerProps {
  onSyncComplete?: () => void;
  autoSync?: boolean; // Whether to enable auto-sync
  interval?: number; // Sync interval in milliseconds
}

export default function MailboxSyncScheduler({ 
  onSyncComplete,
  autoSync = true, 
  interval = 5 * 60 * 1000  // Default: 5 minutes
}: MailboxSyncSchedulerProps) {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Auto-sync based on interval
  useEffect(() => {
    if (!autoSync) return;
    
    // Initial sync on component mount
    syncMailboxes();
    
    // Setup interval for regular syncs
    const intervalId = setInterval(syncMailboxes, interval);
    
    return () => clearInterval(intervalId);  }, [autoSync, interval]);

  async function syncMailboxes() {
    if (isLoading) return;
    
    setIsLoading(true);
    setSyncStatus('loading');
    setErrorMessage(null);
    
    try {
      // Use AbortController to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/mailbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body for syncing all mailboxes
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      let result: SyncAllMailboxesResult = { success: false };
        // Check if there's content to parse
      const contentLength = response.headers.get('content-length');
      const hasContent = contentLength && parseInt(contentLength, 10) > 0;
      
      if (response.status !== 204 && hasContent) { // 204 = No Content
        try {
          // Get the response as text first
          const responseText = await response.text();
          
          // Try to parse it as JSON if there's actual content
          if (responseText && responseText.trim().length > 0) {
            result = JSON.parse(responseText);
          } else {
            // Empty response body
            result = { 
              success: response.ok, 
              message: 'No content returned'
            };
          }
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          // Set a default result object if parsing fails
          result = { 
            success: response.ok, 
            error: 'Invalid JSON response'
          };
        }
      } else {
        // For empty responses or 204, set a default success result
        result = { 
          success: response.ok, 
          message: response.status === 204 ? 'No content' : 'Empty response'
        };
      }      // Handle non-OK responses
      if (!response.ok) {
        const errorMsg = result?.error || `Failed to sync mailboxes: ${response.status} ${response.statusText}`;
        
        // Log the error for debugging
        console.error('Sync request failed:', { 
          status: response.status,
          statusText: response.statusText,
          result
        });
        
        throw new Error(errorMsg);
      }
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      setSyncStatus('success');
      
      // Calculate stats to display in toast
      const mailboxCount = result?.results?.length || 0;
      const successCount = result?.results?.filter((r: any) => r.success)?.length || 0;
      const processedCount = result?.results?.reduce((acc: number, r: any) => acc + (r.processedCount || 0), 0) || 0;
      
      // Show success toast only for manual sync (not auto-sync)
      if (!lastSync) {
        toast({
          title: 'Mailbox Sync Completed',
          description: processedCount > 0 
            ? `Synced ${successCount}/${mailboxCount} mailboxes. Found ${processedCount} new emails.`
            : `Synced ${successCount}/${mailboxCount} mailboxes. No new emails found.`,
        });
      }
      
      // Call the onSyncComplete callback if provided
      if (onSyncComplete) {
        onSyncComplete();
      }    } catch (error: any) {
      console.error('Sync error:', error);
      
      // Format a user-friendly error message based on the error type
      let errorMsg = error.message || 'An unexpected error occurred';
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        errorMsg = 'Connection timed out. Please try again.';
      } else if (error.name === 'SyntaxError' && errorMsg.includes('JSON')) {
        errorMsg = 'Invalid response from server. Please try again.';
      } else if (error.message.includes('Failed to fetch') || !navigator.onLine) {
        errorMsg = 'Network connection issue. Please check your internet connection.';
      }
      
      setErrorMessage(errorMsg);
      setSyncStatus('error');
      
      toast({
        title: 'Mailbox Sync Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      
      // Reset status after 3 seconds if it was successful
      if (syncStatus === 'success') {
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    }
  }  // Get the proper icon based on sync status
  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };
  
  // Get status text for accessibility
  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'loading':
        return 'Syncing mailboxes...';
      case 'success':
        return 'Mailboxes synced successfully';
      case 'error':
        return 'Error syncing mailboxes';
      default:
        return 'Sync mailboxes now';
    }
  };

  return (
    <div className="flex flex-col space-y-2">      <Button 
        onClick={() => syncMailboxes()} 
        disabled={isLoading}
        size="sm"
        variant={syncStatus === 'error' ? 'destructive' : 'outline'}
        className="flex items-center gap-2"
        title={errorMessage || getSyncStatusText()}
        aria-label={getSyncStatusText()}
      >
        {getSyncStatusIcon()}
        {isLoading ? 'Syncing...' : 'Sync Mailboxes Now'}
      </Button>
      
      {lastSync && (
        <div className="flex flex-col space-y-0">
          <p className="text-xs text-muted-foreground">
            Last sync: {lastSync}
          </p>
          
          {syncStatus === 'error' ? (
            <p className="text-xs text-red-500 truncate max-w-[250px]" title={errorMessage || undefined}>
              {errorMessage || 'Sync failed'}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/80">
              {isLoading 
                ? 'Processing...' 
                : autoSync 
                  ? 'Auto-sync enabled' 
                  : 'Waiting for manual sync'
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}
