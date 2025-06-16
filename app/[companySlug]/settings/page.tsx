"use client"

import { Mailbox } from "@/types/email"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import AutoReplyTemplates from "@/components/auto-reply-templates"
import { AutoReplyToggle } from "@/components/settings/auto-reply-toggle"
import { NotificationTemplates } from "@/components/settings/notification-templates"

export function ClientDate({ date }: { date: string | number | Date }) {
  if (!date) return null;
  return <span>{new Date(date).toLocaleString()}</span>;
}

export default function SettingsPage() {  const { companySlug } = useParams() as { companySlug: string }
  const { currentCompany, userProfile } = useAuth()
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRepliesEnabled, setAutoRepliesEnabled] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    provider: 'gmail',
    protocol: 'imap',
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPass: '',
    imapSSL: true,
    smtpHost: '',
    smtpPort: '465',
    smtpUser: '',
    smtpPass: '',
    smtpSSL: true,
  })
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    if (currentCompany) {
      fetchMailboxes()
      setAutoRepliesEnabled(currentCompany.autoRepliesEnabled ?? true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany])

  async function fetchMailboxes() {
    if (!currentCompany) return

    setLoading(true)
    try {
      // Always use the real companySlug for mailbox API
      const response = await fetch(`/api/mailbox?companySlug=${currentCompany.slug}`)
      if (!response.ok) throw new Error('Failed to fetch mailboxes')
      const data = await response.json()
      setMailboxes(data.mailboxes)
    } catch (error) {
      console.error("Error fetching mailboxes:", error)
      toast({
        title: "Error",
        description: "Failed to load mailbox settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData({
      ...formData,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : name === 'port'
          ? value // always string
          : value
    })
  }

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompany) return
    setSubmitting(true)
    try {
      // Always use the real companySlug for mailbox API
      const mailboxData = {
        companySlug: currentCompany.slug,
        name: formData.name,
        email: formData.email,
        protocol: formData.protocol,
        imapHost: formData.imapHost,
        imapPort: formData.imapPort ? parseInt(formData.imapPort, 10) : null, // convert to number or null
        imapUser: formData.imapUser,
        imapPass: formData.imapPass,
        imapSSL: formData.imapSSL,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort ? parseInt(formData.smtpPort, 10) : null, // convert to number or null
        smtpUser: formData.smtpUser,
        smtpPass: formData.smtpPass,
        smtpSSL: formData.smtpSSL,
        provider: formData.provider,
      }
      const response = await fetch('/api/mailbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mailboxData),
      })
      if (!response.ok) throw new Error('Failed to add mailbox')
      fetchMailboxes()
      setFormData({
        name: '',
        email: '',
        provider: 'gmail',
        protocol: 'imap',
        imapHost: '',
        imapPort: '993',
        imapUser: '',
        imapPass: '',
        imapSSL: true,
        smtpHost: '',
        smtpPort: '465',
        smtpUser: '',
        smtpPass: '',
        smtpSSL: true,
      })
      toast({ title: 'Mailbox added', description: 'Mailbox added and tested successfully.' })
    } catch (error) {
      console.error('Error adding mailbox:', error)
      toast({ title: 'Error', description: 'Failed to add mailbox. Please check your settings.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleMailbox = async (mailbox: Mailbox) => {
    if (!currentCompany) return;
    try {
      // Always use the real companySlug for mailbox PATCH API if needed
      const response = await fetch(`/api/mailbox/${mailbox.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !mailbox.isActive, companySlug: currentCompany.slug })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update mailbox status')
      }
      toast({
        title: mailbox.isActive ? "Mailbox disabled" : "Mailbox enabled",
        description: `Mailbox ${mailbox.name} has been ${mailbox.isActive ? 'disabled' : 'enabled'}.`,
      })
      setMailboxes(mailboxes.map(m =>
        m.id === mailbox.id ? { ...m, isActive: !m.isActive } : m
      ))
    } catch (error) {
      console.error("Error toggling mailbox:", error)
      toast({
        title: "Error",
        description: "Failed to update mailbox status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMailbox = async (mailbox: Mailbox) => {
    if (!currentCompany) return;
    if (window.confirm(`Are you sure you want to delete the mailbox "${mailbox.name}"?`)) {
      try {
        // Always use the real companySlug for mailbox DELETE API if needed
        const response = await fetch(`/api/mailbox/${mailbox.id}?companySlug=${currentCompany.slug}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete mailbox')
        }
        toast({
          title: "Mailbox deleted",
          description: `Mailbox ${mailbox.name} has been deleted.`,
        })
        setMailboxes(mailboxes.filter(m => m.id !== mailbox.id))
      } catch (error) {
        console.error("Error deleting mailbox:", error)
        toast({
          title: "Error",
          description: "Failed to delete mailbox. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const handleUpdateCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompany) return
    try {
      const form = e.target as HTMLFormElement
      const supportEmail = (form.elements.namedItem('supportEmail') as HTMLInputElement).value
      const ticketPrefix = (form.elements.namedItem('ticketPrefix') as HTMLInputElement).value
      // PATCH company by slug, not by ID
      await fetch(`/api/companies/${currentCompany.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supportEmail,
          settings: {
            ...currentCompany.settings,
            ticketIdPrefix: ticketPrefix
          }
        })
      })
      toast({
        title: "Settings updated",
        description: "Company settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating company settings:", error)
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!currentCompany || !userProfile) {
    return (
      <div className="flex">
        <Sidebar companySlug={companySlug} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div>Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar companySlug={companySlug} />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your ticketing system</p>
        </div>        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>
            <TabsTrigger value="auto-reply">Auto-Reply</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Configure your company's basic settings</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateCompanySettings} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium">
                      Company Name
                    </label>
                    <Input
                      id="companyName"
                      name="companyName"
                      defaultValue={currentCompany.name}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="supportEmail" className="text-sm font-medium">
                      Support Email
                    </label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      defaultValue={currentCompany.supportEmail}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ticketPrefix" className="text-sm font-medium">
                      Ticket ID Prefix
                    </label>
                    <Input
                      id="ticketPrefix"
                      name="ticketPrefix"
                      defaultValue={currentCompany.settings.ticketIdPrefix}
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Short code used for ticket IDs (e.g., "ABC" for ABC-123456)
                    </p>
                  </div>

                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mailboxes">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Email Mailboxes</CardTitle>
                <CardDescription>Connect email accounts to receive support emails</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4">Loading mailboxes...</div>
                ) : mailboxes.length > 0 ? (
                  <div className="space-y-4">
                    {mailboxes.map((mailbox) => (
                      <div key={mailbox.id} className="border p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{mailbox.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {mailbox.email} ({mailbox.protocol ? mailbox.protocol.toUpperCase() : "UNKNOWN"})
                            </p>
                            <div className="text-xs mt-1 flex gap-4">
                              <span>
                                {mailbox.isActive ? (
                                  <span className="text-green-600">Active</span>
                                ) : (
                                  <span className="text-red-600">Inactive</span>
                                )}
                              </span>
                              {mailbox.lastSyncAt && (
                                <span>
                                  Last synced: <ClientDate date={mailbox.lastSyncAt} />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleMailbox(mailbox)}
                            >
                              {mailbox.isActive ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMailbox(mailbox)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p>No mailboxes configured</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a mailbox below to start receiving support emails
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Mailbox</CardTitle>
                <CardDescription>Connect a new email account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMailbox} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Mailbox Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Support Inbox"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="support@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="protocol" className="text-sm font-medium">
                      Connection Type
                    </label>
                    <select
                      id="protocol"
                      name="protocol"
                      value={formData.protocol}
                      onChange={handleInputChange}
                      className="w-full border border-input bg-background px-3 py-2 rounded-md"
                      required
                    >
                      <option value="imap">IMAP</option>
                      <option value="gmail">Gmail</option>
                      <option value="exchange">Microsoft Exchange</option>
                      <option value="smtp">SMTP</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="imapHost" className="text-sm font-medium">
                        IMAP Server
                      </label>
                      <Input
                        id="imapHost"
                        name="imapHost"
                        placeholder="imap.example.com"
                        value={formData.imapHost}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="imapPort" className="text-sm font-medium">
                        IMAP Port
                      </label>
                      <Input
                        id="imapPort"
                        name="imapPort"
                        type="number"
                        placeholder="993"
                        value={formData.imapPort ?? ""}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="imapUser" className="text-sm font-medium">
                        IMAP Username
                      </label>
                      <Input
                        id="imapUser"
                        name="imapUser"
                        placeholder="username@example.com"
                        value={formData.imapUser}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="imapPass" className="text-sm font-medium">
                        IMAP Password
                      </label>
                      <Input
                        id="imapPass"
                        name="imapPass"
                        type="password"
                        placeholder="••••••••"
                        value={formData.imapPass}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="imapSSL"
                      name="imapSSL"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={formData.imapSSL}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="imapSSL" className="text-sm font-medium">
                      Use secure connection (SSL/TLS) for IMAP
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="smtpHost" className="text-sm font-medium">
                        SMTP Server
                      </label>
                      <Input
                        id="smtpHost"
                        name="smtpHost"
                        placeholder="smtp.example.com"
                        value={formData.smtpHost}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="smtpPort" className="text-sm font-medium">
                        SMTP Port
                      </label>
                      <Input
                        id="smtpPort"
                        name="smtpPort"
                        type="number"
                        placeholder="465"
                        value={formData.smtpPort ?? ""}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="smtpUser" className="text-sm font-medium">
                        SMTP Username
                      </label>
                      <Input
                        id="smtpUser"
                        name="smtpUser"
                        placeholder="username@example.com"
                        value={formData.smtpUser}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="smtpPass" className="text-sm font-medium">
                        SMTP Password
                      </label>
                      <Input
                        id="smtpPass"
                        name="smtpPass"
                        type="password"
                        placeholder="••••••••"
                        value={formData.smtpPass}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="smtpSSL"
                      name="smtpSSL"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={formData.smtpSSL}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="smtpSSL" className="text-sm font-medium">
                      Use secure connection (SSL/TLS) for SMTP
                    </label>
                  </div>

                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Mailbox"}
                  </Button>
                </form>
              </CardContent>            </Card>
          </TabsContent>          <TabsContent value="auto-reply">
            <div className="space-y-6">
              <AutoReplyToggle 
                companyId={currentCompany.id}
                companySlug={companySlug}
                autoRepliesEnabled={autoRepliesEnabled}
                onUpdate={setAutoRepliesEnabled}
              />              <Card>
                <CardHeader>
                  <CardTitle>Auto-Reply Templates</CardTitle>
                  <CardDescription>
                    Configure customizable auto-reply templates with variable fields for new tickets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AutoReplyTemplates companySlug={companySlug} />
                </CardContent>
              </Card>            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Email Templates</CardTitle>
                  <CardDescription>
                    Configure email templates sent to customers when tickets are created or updated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationTemplates companySlug={companySlug} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage user access to the ticketing system</CardDescription>
              </CardHeader>
              <CardContent>
                {/* User management functionality will be implemented in a future update */}
                <p>User management functionality will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
