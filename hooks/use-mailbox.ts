   import { useState, useEffect } from 'react'
import { Mailbox } from '@/types/email'

export function useMailbox(companyId: string) {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMailboxes() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/mailbox?companyId=${companyId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch mailboxes')
        }
        const data = await response.json()
        setMailboxes(data.mailboxes || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchMailboxes()
    }
  }, [companyId])

  const syncMailbox = async (mailboxId: string) => {
    try {
      const response = await fetch(`/api/mailbox/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mailboxId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync mailbox')
      }
      
      return await response.json()
    } catch (err) {
      throw err
    }
  }

  return { mailboxes, isLoading, error, syncMailbox }
}