"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { useToast } from "@/components/ui/use-toast"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { OrderDetails } from "@/components/order-details"
import type { Order, OrderStatus } from "@/lib/orders"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)

      // Get the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          users (
            id,
            name,
            email
          )
        `)
        .eq("id", orderId)
        .single()

      if (orderError) throw orderError

      // Get the order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          price,
          products (
            name,
            image
          )
        `)
        .eq("order_id", orderId)

      if (itemsError) throw itemsError

      const items = orderItems.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products.name,
        price: item.price,
        quantity: item.quantity,
        image: item.products.image,
      }))

      setOrder({
        ...orderData,
        items,
        user: {
          id: orderData.users.id,
          name: orderData.users.name,
          email: orderData.users.email,
        },
      })
    } catch (error: any) {
      console.error("Error fetching order:", error)
      setError(error.message || "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) throw error

      // Update local state
      if (order) {
        setOrder({
          ...order,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
      }

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error: any) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const statusOptions: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "failed",
    "payment_required",
  ]

  if (loading) {
    return (
      <div className="container py-8">
        <LoadingSpinner text="Loading order details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Order Details</h1>
        <ErrorMessage message={error} />
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold">Order #{order.id.substring(0, 8)}</h1>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <Select value={order.status} onValueChange={(value) => handleUpdateStatus(value as OrderStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderDetails order={order} />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Details about the customer who placed this order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Customer</h3>
                <p>{order.user?.name}</p>
                <p className="text-sm text-muted-foreground">{order.user?.email}</p>
              </div>

              <div>
                <h3 className="font-semibold">Order Date</h3>
                <p>{format(new Date(order.created_at), "PPP")}</p>
              </div>

              {order.updated_at && (
                <div>
                  <h3 className="font-semibold">Last Updated</h3>
                  <p>{format(new Date(order.updated_at), "PPP")}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold">Payment ID</h3>
                <p className="break-all text-sm">{order.payment_intent_id || "N/A"}</p>
              </div>

              <div className="pt-4 border-t">
                <Link href={`/admin/users/${order.user?.id}`}>
                  <Button variant="outline" className="w-full">
                    View Customer Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
