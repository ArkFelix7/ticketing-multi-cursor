"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { Ticket } from "@/types/ticket"

export default function DashboardPage() {
  const { companySlug } = useParams() as { companySlug: string }
  const { userProfile, currentCompany, isLoading } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [recentTicketsLoading, setRecentTicketsLoading] = useState(true)
  const [ticketStats, setTicketStats] = useState({
    open: 0,
    pending: 0,
    inProgress: 0,
    closed: 0
  })
  const [redirected, setRedirected] = useState(false)
  
  useEffect(() => {
    // Only redirect if we have completed loading, have a company with a slug,
    // and its slug doesn't match the URL and we haven't already triggered a redirect
    if (!isLoading && currentCompany && currentCompany.slug && 
        currentCompany.slug !== companySlug && !redirected) {
      console.log(`Redirecting from ${companySlug} to ${currentCompany.slug}`);
      setRedirected(true); // Prevent infinite loop
      router.push(`/${currentCompany.slug}/dashboard`);
    }
  }, [isLoading, currentCompany?.id, currentCompany?.slug, companySlug, redirected])
  useEffect(() => {
    if (currentCompany && currentCompany.id && !redirected) {
      // Only fetch data if we have a valid company and aren't about to redirect
      fetchRecentTickets();
      fetchTicketStats();
    }
  }, [currentCompany, redirected])
  async function fetchRecentTickets() {
    if (!currentCompany) return
    
    setRecentTicketsLoading(true)
    try {
      // Fetch tickets from API using Prisma instead of Firestore
      const response = await fetch(`/api/tickets?companyId=${currentCompany.id}&limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error)    } finally {
      setRecentTicketsLoading(false)
    }
  }
  
  async function fetchTicketStats() {
    if (!currentCompany) return
    
    try {
      // Fetch ticket stats from API using Prisma instead of Firestore
      const response = await fetch(`/api/tickets/stats?companyId=${currentCompany.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticket stats');
      }
      
      const data = await response.json();
      setTicketStats({
        open: data.stats?.open || 0,
        pending: data.stats?.pending || 0,
        inProgress: data.stats?.inProgress || 0,
        closed: data.stats?.closed || 0
      });
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      // Set default values in case of error
      setTicketStats({
        open: 0,
        pending: 0,
        inProgress: 0,
        closed: 0
      });
    }
  }
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Add debugging information for development
  console.log('Dashboard render - URL companySlug:', companySlug);
  console.log('Dashboard render - currentCompany:', currentCompany?.slug);
  console.log('Dashboard render - isLoading:', isLoading);
  console.log('Dashboard render - redirected:', redirected);

  return (
    <div className="flex">
      <Sidebar companySlug={companySlug as string} />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userProfile?.displayName}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats.open}</div>
              <p className="text-xs text-muted-foreground">Awaiting initial response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Currently being worked on</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats.pending}</div>
              <p className="text-xs text-muted-foreground">Waiting for customer response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats.closed}</div>
              <p className="text-xs text-muted-foreground">Resolved tickets this month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Your most recently created tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTicketsLoading ? (
              <div className="flex justify-center py-4">Loading tickets...</div>
            ) : tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {ticket.ticketNumber}: {ticket.subject}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          From: {ticket.requesterName} ({ticket.requesterEmail})
                        </p>
                      </div>
                      <div>
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
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                      {ticket.assignee && (
                        <span className="text-xs text-muted-foreground">
                          Assigned to: {ticket.assignee.displayName}
                        </span>
                      )}
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p>No tickets found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you receive emails or create tickets, they will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
