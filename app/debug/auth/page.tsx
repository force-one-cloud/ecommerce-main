"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function AuthDebugPage() {
  const { user, isAdmin } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)

        // Check environment variables
        const envCheck = {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
        }
        setEnvVars(envCheck)

        // Get session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setSessionError(error.message)
        } else {
          setSession(data.session)
        }
      } catch (error: any) {
        console.error("Error checking auth:", error)
        setSessionError(error.message || "Unknown error checking authentication")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  const refreshSession = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        setSessionError(error.message)
      } else {
        setSession(data.session)
        setSessionError(null)
      }

      // Force reload the page to update the auth context
      window.location.reload()
    } catch (error: any) {
      console.error("Error refreshing session:", error)
      setSessionError(error.message || "Unknown error refreshing session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>

      {sessionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{sessionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if Supabase environment variables are properly set</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                {JSON.stringify(envVars, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth Context State</CardTitle>
            <CardDescription>Current authentication state from the Auth Context</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
              {JSON.stringify({ user, isAdmin }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Session</CardTitle>
            <CardDescription>Current session from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Button onClick={refreshSession} disabled={loading}>
          Refresh Session
        </Button>
      </div>
    </div>
  )
}
