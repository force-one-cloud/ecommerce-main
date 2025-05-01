"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function AuthDebugPage() {
  const { user, isAdmin, signIn } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        setSession(data.session)
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [supabase])

  const handleTestSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setTestLoading(true)
    setTestResult(null)

    try {
      // Test direct Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setTestResult({
        success: true,
        message: "Direct Supabase authentication successful",
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          session: {
            expires_at: data.session?.expires_at,
          },
        },
      })

      toast({
        title: "Test successful",
        description: "Direct Supabase authentication worked",
      })
    } catch (error: any) {
      console.error("Test sign in error:", error)
      setTestResult({
        success: false,
        message: error.message || "Authentication failed",
        error: error,
      })

      toast({
        title: "Test failed",
        description: error.message || "Authentication failed",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleUseAuthSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setTestLoading(true)
    setTestResult(null)

    try {
      // Test useAuth hook's signIn
      await signIn(email, password)

      setTestResult({
        success: true,
        message: "useAuth hook authentication successful",
      })

      toast({
        title: "Test successful",
        description: "useAuth hook authentication worked",
      })
    } catch (error: any) {
      console.error("useAuth sign in error:", error)
      setTestResult({
        success: false,
        message: error.message || "Authentication failed",
        error: error,
      })

      toast({
        title: "Test failed",
        description: error.message || "Authentication failed",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Auth State</CardTitle>
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
            <CardTitle>Current Supabase Session</CardTitle>
            <CardDescription>Current session from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading session...</p>
            ) : (
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Authentication</CardTitle>
            <CardDescription>Test sign in with Supabase directly and through useAuth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleTestSignIn} disabled={testLoading}>
                Test Direct Supabase Auth
              </Button>
              <Button onClick={handleUseAuthSignIn} disabled={testLoading} variant="outline">
                Test useAuth Hook
              </Button>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-md ${testResult.success ? "bg-green-50" : "bg-red-50"}`}>
                <h3 className={`font-medium ${testResult.success ? "text-green-700" : "text-red-700"}`}>
                  {testResult.success ? "Success" : "Error"}
                </h3>
                <p className={testResult.success ? "text-green-600" : "text-red-600"}>{testResult.message}</p>
                {testResult.data && (
                  <pre className="mt-2 bg-white p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
