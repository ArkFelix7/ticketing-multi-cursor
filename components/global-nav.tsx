"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  TicketIcon,
  MessageSquareIcon,
  FileTextIcon,
  BarChartIcon,
  SettingsIcon,
  MenuIcon,
  HomeIcon,
  InboxIcon,
  LogOutIcon,
  UserIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"

// Define two sets of navigation items - one for logged out users and one for logged in
const getNavItems = (companySlug: string | null) => {
  if (!companySlug) {
    return [
      {
        name: "Home",
        href: "/",
        icon: HomeIcon,
      },
      {
        name: "Login",
        href: "/login",
        icon: UserIcon,
      },
      {
        name: "Register",
        href: "/register",
        icon: LogOutIcon,
      }
    ];
  }
  
  return [
    {
      name: "Dashboard",
      href: `/${companySlug}/dashboard`,
      icon: HomeIcon,
    },
    {
      name: "Inbox",
      href: `/${companySlug}/inbox`,
      icon: InboxIcon,
    },
    {
      name: "Tickets",
      href: `/${companySlug}/tickets`,
      icon: TicketIcon,
    },
    {
      name: "Settings",
      href: `/${companySlug}/settings`,
      icon: SettingsIcon,
    }
  ];
}

export function GlobalNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  
  // Extract company slug from pathname if it exists
  // Format would be /companyslug/section
  const pathSegments = pathname.split('/').filter(Boolean)
  const companySlug = pathSegments.length > 0 && !['login', 'register', 'invite'].includes(pathSegments[0]) 
    ? pathSegments[0] 
    : null
  
  const navItems = getNavItems(companySlug)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav items={navItems} setOpen={setOpen} />
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Multi-Tenant Ticketing</span>
          </Link>
          {companySlug && (
            <span className="hidden rounded-md bg-primary px-2 py-1 text-xs text-white md:inline-block">
              {companySlug}
            </span>
          )}
        </div>

        <div className="hidden md:flex md:flex-1 md:justify-center">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end md:flex-none md:justify-center">
          {companySlug ? <UserNav /> : null}
        </div>
      </div>
    </header>
  )
}

function MobileNav({
  items,
  setOpen,
}: {
  items: { name: string; href: string; icon?: React.ComponentType<{ className?: string }> }[]
  setOpen: (open: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-4 px-2 py-6">
      <Link
        href="/"
        className="flex items-center gap-2 px-2"
        onClick={() => setOpen(false)}
      >
        <span className="font-bold">Multi-Tenant Ticketing</span>
      </Link>
      {items?.map((item) => (
        <MobileLink
          key={item.href}
          href={item.href}
          onOpenChange={setOpen}
          className="flex items-center gap-2"
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.name}</span>
        </MobileLink>
      ))}
    </div>
  )
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: {
  href: string
  onOpenChange: (open: boolean) => void
  className?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  return (
    <Link
      href={href}
      onClick={() => onOpenChange(false)}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        pathname === href ? "text-primary" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}

function UserNav() {
  const { userProfile, signOut } = useAuth()
  const pathname = usePathname()
  
  // Extract company slug from pathname if it exists
  const pathSegments = pathname.split('/').filter(Boolean)
  const companySlug = pathSegments.length > 0 ? pathSegments[0] : null
  
  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }
  
  function getInitials(name: string | undefined) {
    if (!name) return "U"
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            {userProfile?.photoURL ? (
              <AvatarImage src={userProfile.photoURL} alt={`${userProfile.displayName}'s avatar`} />
            ) : null}
            <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          {userProfile?.displayName}
          <p className="text-xs font-normal text-muted-foreground">{userProfile?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={`/${companySlug}/settings`}>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}