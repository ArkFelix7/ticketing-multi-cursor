import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date)
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "open":
      return "text-green-500"
    case "in progress":
      return "text-blue-500"
    case "closed":
      return "text-gray-500"
    case "pending":
      return "text-yellow-500"
    case "urgent":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "text-red-500"
    case "medium":
      return "text-yellow-500"
    case "low":
      return "text-green-500"
    default:
      return "text-gray-500"
  }
}

export function generateTicketId(companyPrefix: string, number: number): string {
  return `${companyPrefix}-${String(number).padStart(4, "0")}`
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

export function parseEmailAddress(email: string): { email: string; name: string | null } {
  const match = email.match(/^(?:"?([^"]*)"?\s*)?(?:<(.+)>)?$/)
  if (!match) return { email, name: null }
  
  const [, name, parsedEmail] = match
  
  return {
    email: parsedEmail || email,
    name: name || null,
  }
}

// Filter function for recommendations
export function filterCCRecommendations(
  recipients: string[],
  currentCCs: string[],
  ticketTags: string[]
): string[] {
  // This is a placeholder for the actual filtering logic
  // In a real implementation, this would use rules or ML to determine who should be CC'd
  const filteredRecipients = recipients.filter(r => !currentCCs.includes(r))
  
  // Simple matching based on tags
  if (ticketTags.includes("billing")) {
    return filteredRecipients.filter(r => r.includes("billing") || r.includes("finance"))
  }
  
  if (ticketTags.includes("technical")) {
    return filteredRecipients.filter(r => r.includes("support") || r.includes("tech"))
  }
  
  return filteredRecipients
}
