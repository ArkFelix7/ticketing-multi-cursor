   import { useState, useEffect } from 'react'
import { Company } from '@/types/company'

export function useCompany(companySlug: string) {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompany() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/companies/${companySlug}`)
        if (!response.ok) {
          throw new Error('Failed to fetch company')
        }
        const data = await response.json()
        setCompany(data.company)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (companySlug) {
      fetchCompany()
    }
  }, [companySlug])

  return { company, isLoading, error }
}