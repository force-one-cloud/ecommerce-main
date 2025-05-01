"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [dbLoading, setDbLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to finish loading
      if (loading) return

      // Check if user is logged in
      if (!user) {
        setError("You need to sign in to access the admin area.")
        toast({
          title: "Access denied",
          description: "You need to sign in to access the admin area.",
          variant: "destructive",
        })
        router.push("/signin")
        return
      }

      try {
        // Double-check admin status directly from the database
        setDbLoading(true)
        const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (error) throw error

        setDbUser(data)
        const isUserAdmin = data.role === "admin"

        // If not admin according to the database
        if (!isUserAdmin) {
          setError("You don't have permission to access the admin area.")
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive",
          })
          router.push("/")
        }
      } catch (error: any) {
        console.error("Error checking admin status:", error)
        setError(error.message || "Failed to verify admin status")
      } finally {
        setDbLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, isAdmin, loading, router, toast, supabase])

  // Show loading state while checking auth
  if (loading || dbLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show error if there is one
  if (error) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  // If we're still here, user should be an admin
  const dbRole = dbUser?.role
  const isDbAdmin = dbRole === "admin"

  // Final safety check
  if (!isDbAdmin) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Your account does not have admin privileges. Database role: {dbRole || "none"}
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white hidden md:block">
        <div className="p-4 h-16 flex items-center border-b border-slate-800">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-8 pt-4 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-slate-800 hover:text-white"
              onClick={() => router.push("/debug")}
            >
              Debug Auth
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-slate-800 hover:text-white mt-2"
              onClick={() => {
                supabase.auth.signOut()
                router.push("/")
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile sidebar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white md:hidden">
        <nav className="flex justify-around p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center p-2">
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold">Admin Portal</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Logged in as: {user?.name} ({dbRole})
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  )
}
