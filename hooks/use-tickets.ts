   import { useState, useEffect } from 'react'
import { Ticket } from '@/types/ticket'

export function useTickets(companyId: string) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/tickets?companyId=${companyId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch tickets')
        }
        const data = await response.json()
        setTickets(data.tickets || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchTickets()
    }
  }, [companyId])

  const createTicket = async (ticketData: Partial<Ticket>) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...ticketData, companyId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create ticket')
      }
      
      const newTicket = await response.json()
      setTickets(prev => [newTicket.ticket, ...prev])
      return newTicket.ticket
    } catch (err) {
      throw err
    }
  }

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update ticket')
      }
      
      const updatedTicket = await response.json()
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? updatedTicket.ticket : ticket
      ))
      return updatedTicket.ticket
    } catch (err) {
      throw err
    }
  }

  return { tickets, isLoading, error, createTicket, updateTicket }
}