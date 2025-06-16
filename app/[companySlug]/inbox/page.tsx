"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { Email } from "@/types/email"
import { toast } from "@/hooks/use-toast"
import MailboxSyncScheduler from "@/components/mailbox-sync-scheduler"
import { EmailUtils } from "@/lib/email-utils"
import { Badge } from "@/components/ui/badge"
import { EmailActions } from "@/components/email/email-actions"

export default function InboxPage() {
  const { companySlug } = useParams()
  const router = useRouter()
  const { currentCompany } = useAuth()
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [filter, setFilter] = useState<'all' | 'ticketed' | 'unticketed' | 'unprocessed'>('all')
  const [intervalId, setIntervalId] = useState<number | null>(null)
  const [autoRepliesEnabled, setAutoRepliesEnabled] = useState(true)
  useEffect(() => {
    if (currentCompany) {
      fetchEmails()
      setAutoRepliesEnabled(currentCompany.autoRepliesEnabled ?? true)
      
      // Set up auto-refresh every 30 seconds
      const interval = window.setInterval(() => {
        fetchEmails(false) // silent refresh - don't show loading indicator
      }, 30000)
      
      setIntervalId(interval)
      
      // Clean up interval on unmount
      return () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    }
  }, [currentCompany])

  async function fetchEmails(showLoading = true) {
    if (!currentCompany || !companySlug) return
    if (showLoading) setLoading(true)
    try {
      const res = await fetch(`/api/companies/${companySlug}/emails`)
      if (!res.ok) throw new Error("Failed to fetch emails")
      const data = await res.json()
      setEmails(data.emails)
      
      // If currently selected email exists in new data, update it
      if (selectedEmail) {
        const updatedEmail = data.emails.find((e: Email) => e.id === selectedEmail.id)
        if (updatedEmail) {
          setSelectedEmail(updatedEmail)
        }
      }
    } catch (error) {
      console.error("Error fetching emails:", error)
      if (showLoading) {
        toast({ title: "Error", description: "Failed to load emails.", variant: "destructive" })
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }
  
  async function createTicketFromEmail(email: Email) {
    if (!currentCompany) return
    setCreatingTicket(true)
    try {
      // Get the current user ID from auth context if available, otherwise use null
      // The API will handle using the company owner as a fallback
      const currentUserId = currentCompany.ownerId;

      const res = await fetch(`/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: currentCompany.id,
          emailId: email.id,
          creatorId: currentUserId,
          subject: email.subject || '(No subject)'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to create ticket" }));
        throw new Error(errorData.error || "Failed to create ticket");
      }
      
      // Refresh emails instead of removing one
      await fetchEmails()
      
      const ticket = await res.json()
      toast({ 
        title: "Ticket created", 
        description: `Ticket ${ticket.ticketNumber} has been created successfully.` 
      })
    } catch (error: any) {
      console.error("Error creating ticket:", error)
      toast({ 
        title: "Error", 
        description: `Failed to create ticket: ${error.message || "Please try again."}`, 
        variant: "destructive" 
      })
    } finally {
      setCreatingTicket(false)
    }
  }
  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true;
    if (filter === 'ticketed') return email.hasTicket;
    if (filter === 'unticketed') return !email.hasTicket;
    if (filter === 'unprocessed') return !email.isProcessed;
    return true;
  });

  function navigateToTicket(ticketId: string) {
    if (!companySlug) return
    router.push(`/${companySlug}/tickets/${ticketId}`)
  }

  return (
    <div className="flex">
      <Sidebar companySlug={companySlug as string} />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Email Inbox</h1>
          <div className="flex items-center gap-2">            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchEmails()}
              disabled={loading}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">🔄</span>
                  Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh Inbox
                </>
              )}
            </Button>
            <MailboxSyncScheduler onSyncComplete={fetchEmails} />
          </div>
        </div>        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📧 Email Inbox</h1>
          <p className="text-gray-600 mt-2">View and process incoming emails • Create tickets from customer inquiries</p>
          
          {!autoRepliesEnabled && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <h3 className="font-medium text-yellow-800">Manual Email Processing Mode</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Auto-replies are disabled. New emails won't automatically create tickets. 
                    Use the <strong>"🔴 Unprocessed"</strong> filter to see emails that need manual conversion or replies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-6">
          <div className="w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>All Emails</CardTitle>
                <CardDescription>All incoming emails, with ticket status</CardDescription>                <div className="flex gap-2 mt-2">
                  <Button 
                    variant={filter === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    📧 All ({emails.length})
                  </Button>
                  
                  {!autoRepliesEnabled && (
                    <Button 
                      variant={filter === 'unprocessed' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setFilter('unprocessed')}
                      className={filter === 'unprocessed' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      🔴 Unprocessed ({emails.filter(e => !e.isProcessed).length})
                    </Button>
                  )}
                  
                  <Button 
                    variant={filter === 'unticketed' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setFilter('unticketed')}
                    className={filter === 'unticketed' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    ⏳ No Ticket ({emails.filter(e => !e.hasTicket).length})
                  </Button>
                  <Button 
                    variant={filter === 'ticketed' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setFilter('ticketed')}
                    className={filter === 'ticketed' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    ✅ Ticketed ({emails.filter(e => e.hasTicket).length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4 text-center">Loading emails...</div>
                ) : filteredEmails.length > 0 ? (
                  <div className="space-y-2">                    {filteredEmails.map((email) => (                      <div 
                        key={email.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-200 ${
                          selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'hover:bg-gray-50'
                        } ${email.hasTicket ? 'border-l-4 border-l-green-400 bg-green-50/30' : 'border-l-4 border-l-gray-200'}`}
                        onClick={() => setSelectedEmail(email)}
                      ><div className="flex flex-col space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium flex-1 min-w-0">
                              <div className="truncate text-sm leading-5">
                                {email.subject || '(No subject)'}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {email.hasTicket && (
                                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs px-2 py-0.5">
                                  ✓ Ticketed
                                </Badge>
                              )}
                              {email.hasTicket && email.ticketId && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-6 px-2 text-xs font-medium"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToTicket(email.ticketId);
                                  }}
                                >
                                  View →
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground truncate font-medium">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">From:</span> {email.fromName || email.fromEmail}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="inline-flex items-center">
                              📅 {new Date(email.receivedAt).toLocaleDateString()}
                            </span>
                            <span className="inline-flex items-center">
                              🕒 {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p>No emails found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filter !== 'all'
                        ? `No ${filter === 'ticketed' ? 'ticketed' : 'unticketed'} emails found`
                        : "No emails in inbox"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="w-2/3">
            {selectedEmail ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{selectedEmail.subject || '(No subject)'}</CardTitle>
                    <CardDescription>
                      From: {selectedEmail.fromName || selectedEmail.fromEmail} &lt;{selectedEmail.fromEmail}&gt;
                      <br />
                      To: {EmailUtils.getRecipients(selectedEmail).join(', ')}
                      {EmailUtils.getCcRecipients(selectedEmail).length > 0 && (
                        <>
                          <br />
                          CC: {EmailUtils.getCcRecipients(selectedEmail).join(', ')}
                        </>
                      )}
                      <br />
                      Date: {new Date(selectedEmail.receivedAt).toLocaleString()}
                      {selectedEmail.hasTicket && (
                        <>
                          <br />                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              ✅ Ticket Created
                            </Badge>
                            {selectedEmail.ticketId && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
                                onClick={() => navigateToTicket(selectedEmail.ticketId)}
                              >
                                🎫 View Ticket →
                              </Button>
                            )}
                          </div>
                        </>
                      )}                    </CardDescription>
                  </div>
                  <EmailActions 
                    email={selectedEmail} 
                    companySlug={companySlug as string} 
                    onEmailUpdate={fetchEmails}
                  />
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-4 max-h-[500px] overflow-auto email-content">
                    {selectedEmail.bodyHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: EmailUtils.getSafeHtml(selectedEmail) }} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{selectedEmail.bodyPlain || selectedEmail.body}</pre>
                    )}
                  </div>
                  {EmailUtils.getAttachments(selectedEmail).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Attachments ({EmailUtils.getAttachments(selectedEmail).length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {EmailUtils.getAttachments(selectedEmail).map((attachment) => (
                          <div 
                            key={attachment.id}
                            className="border rounded-md p-2 text-sm flex items-center gap-2"
                          >
                            <span>{attachment.filename}</span>
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(attachment.size / 1024)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-md p-8">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Select an email to view</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click on an email from the list to view its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
