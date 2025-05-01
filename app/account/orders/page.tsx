"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Package, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { getOrdersByUserId, type Order, type OrderStatus } from "@/lib/orders"
import { PageHeader } from "@/components/page-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { OrderDetails } from "@/components/order-details"

export default function OrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to sign in to view your orders.",
          variant: "destructive",
        })
        router.push("/signin")
        return
      }

      try {
        setLoading(true)
        // Fetch orders
        const userOrders = await getOrdersByUserId(user.id)
        setOrders(userOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
        toast({
          title: "Failed to load orders",
          description: "There was an error loading your orders.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, router, toast])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="container py-8">
        <LoadingSpinner text="Loading orders..." />
      </div>
    )
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return ["pending", "processing", "shipped"].includes(order.status)
    if (activeTab === "completed") return order.status === "delivered"
    if (activeTab === "payment_issues") return ["cancelled", "failed", "payment_required"].includes(order.status)
    return true
  })

  // Count orders that need payment
  const ordersNeedingPayment = orders.filter((order) =>
    ["cancelled", "failed", "payment_required"].includes(order.status),
  ).length

  // Check if an order can be retried (cancelled, failed, or payment_required)
  const canRetryOrder = (status: OrderStatus) => {
    return status === "cancelled" || status === "failed" || status === "payment_required"
  }

  return (
    <div className="container py-6 md:py-8 px-4 md:px-0">
      <PageHeader title="My Orders" />

      {ordersNeedingPayment > 0 && activeTab !== "payment_issues" && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-400">
                You have {ordersNeedingPayment} {ordersNeedingPayment === 1 ? "order" : "orders"} requiring payment
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Please complete payment to ensure your {ordersNeedingPayment === 1 ? "order is" : "orders are"}{" "}
                processed.
              </p>
              <Button
                variant="outline"
                className="mt-2 bg-amber-100 dark:bg-amber-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800"
                onClick={() => setActiveTab("payment_issues")}
              >
                View Payment Issues
              </Button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="You haven't placed any orders yet. Start shopping to place your first order."
          actionLabel="Browse Products"
          actionLink="/products"
        />
      ) : (
        <>
          <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="payment_issues" className="relative">
                Payment Issues
                {ordersNeedingPayment > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {ordersNeedingPayment}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders found in this category.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === "payment_issues" && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800 dark:text-amber-400">Orders Requiring Payment</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        These orders need payment to be completed. Click "Retry Payment" to complete your purchase.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {filteredOrders.map((order) => (
                <OrderDetails
                  key={order.id}
                  order={order}
                  showActions={canRetryOrder(order.status)}
                  actions={
                    canRetryOrder(order.status) && (
                      <div className="space-y-3">
                        <Link href={`/checkout/retry/${order.id}`}>
                          <Button className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry Payment
                          </Button>
                        </Link>
                        <Link href={`/account/orders/${order.id}`}>
                          <Button variant="outline" className="w-full">
                            View Order Details
                          </Button>
                        </Link>
                      </div>
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
