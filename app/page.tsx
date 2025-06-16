   import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex-1 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Multi-Tenant Ticketing System</h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive solution for companies to manage support tickets across multiple channels
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>For Companies</CardTitle>
              <CardDescription>Register your company and start managing tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Sign up your company, invite team members, connect mailboxes, and start handling support tickets efficiently.
              </p>
              <Link href="/register" className="block">
                <Button className="w-full">Register Your Company</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Team Members</CardTitle>
              <CardDescription>Join your company's support team</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Already have an invite? Log in or accept your invitation to join your company's support team.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Mailbox Integration</CardTitle>
              </CardHeader>
              <CardContent>
                Connect multiple mailboxes via IMAP, Gmail API, Exchange, or SMTP to centralize support communications.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Smart Ticketing</CardTitle>
              </CardHeader>
              <CardContent>
                Automated ticket ID generation, seamless threading, and intelligent CC recommendations.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Multi-tenant</CardTitle>
              </CardHeader>
              <CardContent>
                Each company gets their own secure environment with customizable settings and team management.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}