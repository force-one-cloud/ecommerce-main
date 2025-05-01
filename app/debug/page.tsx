"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function DebugPage() {
  const { user, isAdmin } = useAuth()
  const [dbUser, setDbUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchUserFromDb = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Get user from the database to check role
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error
        setDbUser(data)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserFromDb()
  }, [user, supabase])

  const refreshSession = async () => {
    setLoading(true)
    try {
      // Refresh the session
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error

      // Force reload the page to update the auth context
      window.location.reload()
    } catch (error) {
      console.error("Error refreshing session:", error)
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>

      <div className="grid gap-6">
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
            <CardTitle>Database User</CardTitle>
            <CardDescription>User data directly from the database</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : dbUser ? (
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                {JSON.stringify(dbUser, null, 2)}
              </pre>
            ) : (
              <p>No user data found in database</p>
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
