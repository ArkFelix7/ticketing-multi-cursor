   "use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { 
  LayoutDashboardIcon, 
  InboxIcon, 
  TicketIcon, 
  SettingsIcon, 
  UsersIcon,
  LogOutIcon 
} from "lucide-react"

interface SidebarProps {
  companySlug: string
  className?: string
}

export function Sidebar({ companySlug, className }: SidebarProps) {
  const pathname = usePathname()
  const { userProfile, signOut } = useAuth()
  
  const items = [
    {
      name: "Dashboard",
      href: `/${companySlug}/dashboard`,
      icon: LayoutDashboardIcon
    },
    {
      name: "Inbox",
      href: `/${companySlug}/inbox`,
      icon: InboxIcon
    },
    {
      name: "Tickets",
      href: `/${companySlug}/tickets`,
      icon: TicketIcon
    },
    {
      name: "Team",
      href: `/${companySlug}/team`,
      icon: UsersIcon
    },
    {
      name: "Settings",
      href: `/${companySlug}/settings`,
      icon: SettingsIcon
    }
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className={cn("pb-12 w-64 border-r min-h-screen hidden lg:block", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="mb-8 px-2">
            <h2 className="text-lg font-semibold tracking-tight">{userProfile?.displayName}</h2>
            <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href || pathname.startsWith(`${item.href}/`) 
                    ? "bg-accent text-accent-foreground" 
                    : "transparent",
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 px-6 w-64">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground w-full"
        >
          <LogOutIcon className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}