"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingBag, Users, DollarSign } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Get total products
        const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

        // Get total orders
        const { count: ordersCount } = await supabase.from("orders").select("*", { count: "exact", head: true })

        // Get total users
        const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

        // Get total revenue
        const { data: orders } = await supabase.from("orders").select("total").eq("status", "delivered")

        const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue: totalRevenue,
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return <LoadingSpinner text="Loading dashboard data..." />
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "bg-green-500",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-amber-500",
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View all orders in the Orders section.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage your products in the Products section.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
