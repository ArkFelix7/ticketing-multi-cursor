"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { Ticket } from "@/types/ticket"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

export default function TicketsPage() {
  const { companySlug } = useParams()
  const { currentCompany } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    if (currentCompany && companySlug) {
      fetchTickets()
    }
  }, [currentCompany, companySlug])

  useEffect(() => {
    if (tickets.length > 0) {
      filterTickets()
    } else {
      setFilteredTickets([])
    }
  }, [tickets, searchQuery, statusFilter])
  async function fetchTickets() {
    if (!companySlug) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/${companySlug}/tickets`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }
      
      const data = await response.json()
      setTickets(data.tickets || [])
      
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive"
      })
      setTickets([])
    } finally {
      setLoading(false)
    }
  }
  function filterTickets() {
    let result = [...tickets]
    
    // Apply search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(ticket => 
        ticket.subject.toLowerCase().includes(lowerQuery) ||
        (ticket.requesterEmail && ticket.requesterEmail.toLowerCase().includes(lowerQuery)) ||
        (ticket.requesterName && ticket.requesterName.toLowerCase().includes(lowerQuery)) ||
        (ticket.customerEmail && ticket.customerEmail.toLowerCase().includes(lowerQuery)) ||
        (ticket.customerName && ticket.customerName.toLowerCase().includes(lowerQuery)) ||
        ticket.ticketNumber.toLowerCase().includes(lowerQuery)
      )
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(ticket => ticket.status === statusFilter)
    }
    
    setFilteredTickets(result)
  }
  function getStatusColor(status: string) {
    switch(status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-amber-100 text-amber-800'
      case 'pending': return 'bg-purple-100 text-purple-800'
      case 'closed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getPriorityColor(priority: string) {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex">
      <Sidebar companySlug={companySlug as string} />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">Manage and respond to support tickets</p>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          
          <div className="flex items-center gap-2">
            <Button 
              variant={statusFilter === null ? "secondary" : "outline"} 
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === 'open' ? "secondary" : "outline"} 
              onClick={() => setStatusFilter('open')}
            >
              Open
            </Button>            <Button 
              variant={statusFilter === 'in-progress' ? "secondary" : "outline"} 
              onClick={() => setStatusFilter('in-progress')}
            >
              In Progress
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? "secondary" : "outline"} 
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={statusFilter === 'closed' ? "secondary" : "outline"} 
              onClick={() => setStatusFilter('closed')}
            >
              Closed
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">Loading tickets...</div>
            ) : filteredTickets.length > 0 ? (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/${companySlug}/tickets/${ticket.id}`}>
                    <div className="border rounded-md p-4 hover:bg-accent/50 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {ticket.ticketNumber}: {ticket.subject}
                          </h3>                          <div className="text-sm text-muted-foreground flex flex-wrap gap-4 mt-1">
                            <span>From: {ticket.requesterName || ticket.customerName || 'Unknown'} ({ticket.requesterEmail || ticket.customerEmail || 'N/A'})</span>
                            <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                            {ticket.assignee && (
                              <span>Assigned: {ticket.assignee.displayName}</span>
                            )}
                          </div></div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                            {ticket.status === 'in-progress' ? 'In Progress' : 
                              ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </span>
                        </div>
                      </div>                      <div className="mt-2">
                        <p className="text-sm line-clamp-1">
                          {ticket.messages?.[0]?.body?.replace(/<[^>]*>?/gm, '') || 
                           'No content'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No tickets found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || statusFilter 
                    ? "Try adjusting your search or filters"
                    : "When you receive emails or create tickets, they will appear here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
