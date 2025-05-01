"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Check if test mode is enabled
const isTestMode = process.env.NEXT_PUBLIC_CHECKOUT_TEST_MODE === "true"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Get payment_intent from URL
  const paymentIntentId = searchParams.get("payment_intent")
  const redirectStatus = searchParams.get("redirect_status")

  // The payment has already been processed in the PaymentForm component
  // This page is just for displaying the success message

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 text-3xl font-bold">Order Confirmed!</h1>
        <p className="mt-4 text-muted-foreground">
          {isTestMode
            ? "Your test order has been confirmed. This is a simulation - no payment was processed."
            : "Thank you for your purchase. Your order has been confirmed and will be shipped soon."}
        </p>
        <div className="mt-8 space-y-4">
          <Link href="/account/orders">
            <Button className="w-full">View Orders</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
