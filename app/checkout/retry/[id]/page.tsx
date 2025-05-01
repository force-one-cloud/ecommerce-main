"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { PaymentFormWrapper } from "@/components/payment-form"
import { getOrderById } from "@/lib/orders"
import { OrderDetails } from "@/components/order-details"

// Check if we're in test mode
const isTestMode = process.env.NEXT_PUBLIC_CHECKOUT_TEST_MODE === "true"

export default function RetryPaymentPage() {
  const params = useParams()
  const orderId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [paymentInitiated, setPaymentInitiated] = useState(false)

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to retry payment.",
        variant: "destructive",
      })
      router.push("/signin")
      return
    }

    const fetchOrderAndCreatePaymentIntent = async () => {
      try {
        setLoading(true)

        // Fetch the order
        const orderData = await getOrderById(orderId)
        if (!orderData) {
          throw new Error("Order not found")
        }

        // Check if the order belongs to the current user
        if (orderData.user_id !== user.id) {
          throw new Error("You don't have permission to access this order")
        }

        setOrder(orderData)

        // Create a new payment intent for this order
        const response = await fetch("/api/retry-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            userId: user.id,
            testMode: isTestMode,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to create payment intent")
        }

        setClientSecret(data.clientSecret)
        setPaymentInitiated(true)
      } catch (error: any) {
        console.error("Error:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrderAndCreatePaymentIntent()
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
        <PageHeader title="Retry Payment" />
        <ErrorMessage message={error} />
      </div>
    )
  }

  // Get the current origin for success URL
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const returnUrl = `${origin}/checkout/success`

  return (
    <div className="container py-6 md:py-8 px-4 md:px-0">
      <PageHeader title="Retry Payment" description="Complete your payment for this order" />

      {isTestMode && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-950">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Test Mode Enabled</AlertTitle>
          <AlertDescription>
            Checkout is running in Stripe test mode. Use test card 4242 4242 4242 4242 with any future expiration date,
            any 3-digit CVC, and any 5-digit ZIP code.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-2">Order Details</h2>
          {order && <OrderDetails order={order} />}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Payment Information</h2>
          {clientSecret ? (
            <PaymentFormWrapper clientSecret={clientSecret} returnUrl={returnUrl} orderId={orderId} />
          ) : (
            <LoadingSpinner text="Loading payment form..." />
          )}
        </div>
      </div>
    </div>
  )
}
