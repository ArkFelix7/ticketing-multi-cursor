"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, currentUser, currentCompany } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      // signIn returns a FirebaseUser
      const user = await signIn(email, password)
      if (!user) throw new Error("Login failed");
      // Save an authentication token in a cookie for the middleware to use
      document.cookie = `firebase-auth-token=${await user.getIdToken()}; path=/; max-age=3600`;
      // Fetch user data to check if user has a company
      const userResponse = await fetch(`/api/users/${user.uid}`);
      if (userResponse.ok) {
        const { user: userData } = await userResponse.json();
        // If user has a company, redirect to the dashboard using the company slug
        if (userData?.company && userData.company.slug) {
          document.cookie = `company-slug=${userData.company.slug}; path=/; max-age=3600`;
          router.push(`/${userData.company.slug}/dashboard`);
        } else {
          toast({
            title: "Login successful",
            description: "You need to register a company or accept an invitation",
          })
          router.push("/register") 
        }
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (err: any) {
      console.error("Login error:", err)
      let errorMessage = "Failed to log in. Please check your credentials and try again."
      
      // Firebase auth error handling
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please try again."
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later or reset your password."
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format. Please check your email address."
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary underline underline-offset-4 hover:text-primary-focus">
                Register your company
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}