"use client"

import { useEffect, ReactNode } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"

interface CompanyLayoutProps {
  children: ReactNode;
}

export default function CompanyLayout({ children }: CompanyLayoutProps) {
  const { companySlug } = useParams()
  const { currentUser, currentCompany, isLoading } = useAuth()

  useEffect(() => {
    // If the user is not logged in, redirect to login
    if (!isLoading && !currentUser) {
      redirect('/login')
    }

    // If the user is logged in but doesn't have a company or is trying to access a company they're not part of
    if (!isLoading && currentUser && (!currentCompany || currentCompany.slug !== companySlug)) {
      // If they have no company, redirect to company registration
      if (!currentCompany) {
        redirect('/register')
      } else {
        // If they're trying to access a company they're not part of, redirect to their company
        redirect(`/${currentCompany.slug}/dashboard`)
      }
    }
  }, [isLoading, currentUser, currentCompany, companySlug])

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Only render children once we've confirmed the user has access to this company
  return children
}
