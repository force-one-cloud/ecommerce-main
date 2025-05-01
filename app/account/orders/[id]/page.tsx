"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { getOrderById, type Order, type OrderStatus } from "@/lib/orders"
import { PageHeader } from "@/components/page-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { OrderDetails } from "@/components/order-details"

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to sign in to view order details.",
          variant: "destructive",
        })
        router.push("/signin")
        return
      }

      try {
        setLoading(true)
        // Fetch order
        const orderData = await getOrderById(orderId)

        if (!orderData) {
          setError("Order not found")
          return
        }

        // Check if the order belongs to the current user
        if (orderData.user_id !== user.id) {
          setError("You don't have permission to view this order")
          return
        }

        setOrder(orderData)
      } catch (error: any) {
        console.error("Error fetching order:", error)
        setError(error.message || "Failed to load order details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [user, orderId, router, toast])

  if (!user) {
    return null
  }

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
        <PageHeader title="Order Details" />
        <ErrorMessage message={error} />
        <div className="mt-6">
          <Link href="/account/orders">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  // Check if an order can be retried (cancelled, failed, or payment_required)
  const canRetryOrder = (status: OrderStatus) => {
    return status === "cancelled" || status === "failed" || status === "payment_required"
  }

  const needsPayment = canRetryOrder(order.status)

  return (
    <div className="container py-6 md:py-8 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <PageHeader title={`Order #${order.id.substring(0, 8)}`} />
        <Link href="/account/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>

      {needsPayment && (
        <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="text-amber-800 dark:text-amber-400">Payment Required</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            This order requires payment to be completed. Please use the "Retry Payment" button below to complete your
            purchase.
          </AlertDescription>
        </Alert>
      )}

      <OrderDetails
        order={order}
        showActions={needsPayment}
        actions={
          needsPayment && (
            <Link href={`/checkout/retry/${order.id}`}>
              <Button className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
            </Link>
          )
        }
      />
    </div>
  )
}
