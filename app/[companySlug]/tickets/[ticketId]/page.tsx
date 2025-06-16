"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Ticket, TicketResponse } from "@/types/ticket"
import { toast } from "@/hooks/use-toast"

export default function TicketDetailPage() {
  const { companySlug, ticketId } = useParams()
  const router = useRouter()
  const { userProfile, currentCompany } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [isInternal, setIsInternal] = useState(false)

  useEffect(() => {
    if (currentCompany && ticketId) {
      fetchTicket()
    }
  }, [currentCompany, ticketId])

  async function fetchTicket() {
    if (!ticketId) return
    
    setLoading(true)
    try {
      const ticketRef = doc(db, 'tickets', ticketId as string)
      const ticketDoc = await getDoc(ticketRef)
      
      if (ticketDoc.exists()) {
        const ticketData = ticketDoc.data() as Ticket
        
        // If the ticket has an assignee, fetch their details
        if (ticketData.assigneeId) {
          const userRef = doc(db, 'users', ticketData.assigneeId)
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            ticketData.assignee = userDoc.data() as any
          }
        }
        
        // For each response with an author, fetch the author details
        if (ticketData.responses) {
          for (const response of ticketData.responses) {
            if (response.authorId) {
              const userRef = doc(db, 'users', response.authorId)
              const userDoc = await getDoc(userRef)
              if (userDoc.exists()) {
                response.author = userDoc.data() as any
              }
            }
          }
        }
        
        setTicket(ticketData)
      } else {
        toast({
          title: "Ticket not found",
          description: "The requested ticket does not exist or you don't have permission to view it.",
          variant: "destructive",
        })
        router.push(`/${companySlug}/tickets`)
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
      toast({
        title: "Error",
        description: "Failed to load ticket details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleReply() {
    if (!ticket || !userProfile) return
    
    if (!replyContent.trim()) {
      toast({ 
        title: "Empty reply",
        description: "Please enter a message before sending.",
      })
      return
    }
    
    setSendingReply(true)
    try {
      const ticketRef = doc(db, 'tickets', ticket.id)
      
      // Create response
      const response: Partial<TicketResponse> = {
        content: replyContent,
        contentType: 'text',
        isPublic: !isInternal,
        createdAt: new Date().toISOString(),
        authorId: userProfile.id,
        author: userProfile,
      }
      
      // Update ticket status if public reply
      let statusUpdate = {}
      if (!isInternal) {
        statusUpdate = { 
          status: 'pending',
          updatedAt: serverTimestamp()
        }
      } else {
        statusUpdate = {
          updatedAt: serverTimestamp()
        }
      }
      
      await updateDoc(ticketRef, {
        responses: arrayUnion(response),
        ...statusUpdate
      })
      
      // TODO: If public reply, send email to requester
      
      setReplyContent("")
      toast({
        title: "Reply sent",
        description: isInternal ? "Internal note added." : "Reply has been sent to the customer.",
      })
      
      // Refresh ticket
      fetchTicket()
    } catch (error) {
      console.error("Error sending reply:", error)
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingReply(false)
    }
  }

  async function updateTicketStatus(status: 'open' | 'in progress' | 'pending' | 'closed') {
    if (!ticket) return
    
    try {
      const ticketRef = doc(db, 'tickets', ticket.id)
      await updateDoc(ticketRef, {
        status,
        updatedAt: serverTimestamp(),
        ...(status === 'closed' ? { closedAt: serverTimestamp() } : {})
      })
      
      toast({
        title: "Status updated",
        description: `Ticket status has been updated to ${status}.`,
      })
      
      // Update local state
      setTicket({
        ...ticket,
        status
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function assignTicket() {
    if (!ticket || !userProfile) return
    
    try {
      const ticketRef = doc(db, 'tickets', ticket.id)
      await updateDoc(ticketRef, {
        assigneeId: userProfile.id,
        updatedAt: serverTimestamp()
      })
      
      toast({
        title: "Ticket assigned",
        description: `Ticket has been assigned to you.`,
      })
      
      // Update local state
      setTicket({
        ...ticket,
        assigneeId: userProfile.id,
        assignee: userProfile
      })
    } catch (error) {
      console.error("Error assigning ticket:", error)
      toast({
        title: "Error",
        description: "Failed to assign ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  function formatResponseDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar companySlug={companySlug as string} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div>Loading ticket details...</div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex">
        <Sidebar companySlug={companySlug as string} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div>Ticket not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar companySlug={companySlug as string} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{ticket.ticketNumber}</h1>
              <span 
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                  ticket.status === 'open' 
                    ? 'bg-blue-100 text-blue-800' 
                    : ticket.status === 'in progress' 
                    ? 'bg-amber-100 text-amber-800'
                    : ticket.status === 'pending'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {ticket.status === 'in progress' ? 'In Progress' : 
                  ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </span>
              <span 
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                  ticket.priority === 'urgent' 
                    ? 'bg-red-100 text-red-800'
                    : ticket.priority === 'high' 
                    ? 'bg-orange-100 text-orange-800'
                    : ticket.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
              </span>
            </div>
            <h2 className="text-2xl mt-1">{ticket.subject}</h2>
            <div className="text-sm text-muted-foreground mt-1">
              From {ticket.requesterName} ({ticket.requesterEmail}) • 
              Created on {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="text-sm mb-1">Status</div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={ticket.status === 'open' ? 'default' : 'outline'}
                  onClick={() => updateTicketStatus('open')}
                >
                  Open
                </Button>
                <Button 
                  size="sm" 
                  variant={ticket.status === 'in progress' ? 'default' : 'outline'}
                  onClick={() => updateTicketStatus('in progress')}
                >
                  In Progress
                </Button>
                <Button 
                  size="sm" 
                  variant={ticket.status === 'pending' ? 'default' : 'outline'}
                  onClick={() => updateTicketStatus('pending')}
                >
                  Pending
                </Button>
                <Button 
                  size="sm" 
                  variant={ticket.status === 'closed' ? 'default' : 'outline'}
                  onClick={() => updateTicketStatus('closed')}
                >
                  Closed
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-3/4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {ticket.responses.map((response, index) => (
                    <div key={index} className={`p-4 rounded-md ${response.isPublic ? 'bg-gray-50' : 'bg-amber-50'}`}>
                      <div className="flex gap-4">
                        <Avatar>
                          {response.author?.photoURL && (
                            <AvatarImage src={response.author.photoURL} />
                          )}
                          <AvatarFallback>
                            {response.author 
                              ? getInitials(response.author.displayName) 
                              : getInitials(ticket.requesterName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {response.author?.displayName || ticket.requesterName}
                              {!response.isPublic && (
                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full ml-2">
                                  Internal Note
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatResponseDate(response.createdAt)}
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            {response.contentType === 'html' ? (
                              <div dangerouslySetInnerHTML={{ __html: response.content }} />
                            ) : (
                              <p className="whitespace-pre-wrap">{response.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type your reply here..."
                  className="min-h-32"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex items-center mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Internal note (not visible to customer)</span>
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {!isInternal && "This reply will be sent to the customer via email"}
                </span>
                <Button onClick={handleReply} disabled={sendingReply}>
                  {sendingReply ? "Sending..." : isInternal ? "Add note" : "Send reply"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Assignee</h3>
                  {ticket.assignee ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        {ticket.assignee.photoURL && (
                          <AvatarImage src={ticket.assignee.photoURL} />
                        )}
                        <AvatarFallback>
                          {getInitials(ticket.assignee.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{ticket.assignee.displayName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground">Unassigned</span>
                      <Button size="sm" onClick={assignTicket}>Assign to me</Button>
                    </div>
                  )}
                </div>
                
                {ticket.ccEmails.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium">CC</h3>
                    <div className="text-sm mt-1">
                      {ticket.ccEmails.join(', ')}
                    </div>
                  </div>
                )}

                {ticket.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium">Tags</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ticket.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium">Created</h3>
                  <div className="text-sm mt-1">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Last Updated</h3>
                  <div className="text-sm mt-1">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </div>
                </div>
                
                {ticket.closedAt && (
                  <div>
                    <h3 className="text-sm font-medium">Closed</h3>
                    <div className="text-sm mt-1">
                      {new Date(ticket.closedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
