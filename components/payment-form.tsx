"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PaymentElement, LinkAuthenticationElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { useToast } from "@/components/ui/use-toast"
import { updateOrderStatus } from "@/lib/orders"

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

interface PaymentFormWrapperProps {
  clientSecret: string
  returnUrl: string
  orderId: string
}

export function PaymentFormWrapper({ clientSecret, returnUrl, orderId }: PaymentFormWrapperProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm returnUrl={returnUrl} orderId={orderId} />
    </Elements>
  )
}

interface PaymentFormProps {
  returnUrl: string
  orderId: string
}

function PaymentForm({ returnUrl, orderId }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"initial" | "processing" | "succeeded" | "failed">("initial")

  useEffect(() => {
    if (!stripe) {
      return
    }

    const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret")

    if (!clientSecret) {
      return
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setPaymentStatus("succeeded")
          setMessage("Payment succeeded!")
          break
        case "processing":
          setPaymentStatus("processing")
          setMessage("Your payment is processing.")
          break
        case "requires_payment_method":
          setPaymentStatus("failed")
          setMessage("Your payment was not successful, please try again.")
          break
        default:
          setPaymentStatus("failed")
          setMessage("Something went wrong.")
          break
      }
    })
  }, [stripe])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return
    }

    setIsLoading(true)
    setPaymentStatus("processing")

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: email,
        },
        redirect: "if_required",
      })

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "An unexpected error occurred.")
        } else {
          setMessage("An unexpected error occurred.")
        }
        setPaymentStatus("failed")
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded - handle success case
        setPaymentStatus("succeeded")
        setMessage("Payment succeeded!")

        // Update order status from "payment_required" to "processing"
        await updateOrderStatus(orderId, "processing")

        toast({
          title: "Payment successful",
          description: "Your order has been placed successfully!",
        })

        // Navigate to success page
        setTimeout(() => {
          router.push(`/checkout/success?payment_intent=${paymentIntent.id}&redirect_status=succeeded`)
        }, 1000)
      } else {
        // Payment requires additional action or is processing
        setMessage("Your payment is being processed.")
        setPaymentStatus("processing")
      }
    } catch (err) {
      console.error("Payment error:", err)
      setMessage("An error occurred during payment processing.")
      setPaymentStatus("failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (paymentStatus === "succeeded") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <div className="mb-4 text-green-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground mt-1">Your order has been placed successfully.</p>
            <Button className="mt-4" onClick={() => router.push("/checkout/success")}>
              View Order Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <LinkAuthenticationElement id="link-authentication-element" onChange={(e) => setEmail(e.value.email)} />
          <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
          {message && <ErrorMessage message={message} />}
        </CardContent>
        <CardFooter>
          <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full" type="submit">
            {isLoading ? <LoadingSpinner text="Processing..." className="py-0" /> : "Pay now"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
