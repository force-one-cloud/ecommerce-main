"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Calendar, ShoppingBag } from "lucide-react"
import { format } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  orders?: any[]
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)

      // Get the user
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) throw userError

      // Get user's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (ordersError) throw ordersError

      setUser({
        ...userData,
        orders: ordersData || [],
      })
    } catch (error: any) {
      console.error("Error fetching user:", error)
      setError(error.message || "Failed to load user details")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (newRole: string) => {
    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      // Update local state
      if (user) {
        setUser({
          ...user,
          role: newRole,
        })
      }

      toast({
        title: "Role updated",
        description: `User role changed to ${newRole}`,
      })
    } catch (error: any) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  const roleOptions = ["customer", "admin"]

  if (loading) {
    return (
      <div className="container py-8">
        <LoadingSpinner text="Loading user details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">User Details</h1>
        <ErrorMessage message={error} />
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <Badge
          variant={user.role === "admin" ? "default" : "secondary"}
          className={user.role === "admin" ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          {user.role}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic information about the user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold flex items-center">
                    <span className="mr-2">Name</span>
                  </h3>
                  <p>{user.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Email</span>
                  </h3>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Joined</span>
                  </h3>
                  <p>{user.created_at ? format(new Date(user.created_at), "PPP") : "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold flex items-center">
                    <span>Role</span>
                  </h3>
                  <div className="mt-1">
                    <Select value={user.role} onValueChange={handleUpdateRole}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {user.orders && user.orders.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>The user's most recent orders.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "cancelled" || order.status === "failed"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push("/admin/orders")}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage this user account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={() => router.push(`/admin/orders?user=${user.id}`)}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                View User Orders
              </Button>

              {user.role !== "admin" ? (
                <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => handleUpdateRole("admin")}>
                  Make Admin
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => handleUpdateRole("customer")}>
                  Remove Admin Role
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
