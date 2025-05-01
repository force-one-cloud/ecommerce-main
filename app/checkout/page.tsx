"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { OrderSummary } from "@/components/order-summary"
import { PageHeader } from "@/components/page-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { PaymentFormWrapper } from "@/components/payment-form"

// Check if we're in test mode
const isTestMode = process.env.NEXT_PUBLIC_CHECKOUT_TEST_MODE === "true"

export default function CheckoutPage() {
  const { items, totalPrice, loading: cartLoading, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  })
  const [step, setStep] = useState<"shipping" | "payment">("shipping")
  const [cartItems, setCartItems] = useState<typeof items>([])
  const [orderCreated, setOrderCreated] = useState(false)

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to checkout.",
        variant: "destructive",
      })
      router.push("/signin")
      return
    }

    // Check if we're online
    if (navigator.onLine === false) {
      toast({
        title: "You're offline",
        description: "You need to be online to complete your purchase.",
        variant: "destructive",
      })
      router.push("/cart")
      return
    }

    // Only redirect if cart is empty AND we haven't created an order yet
    if (!cartLoading && items.length === 0 && !orderCreated) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add some products before checkout.",
        variant: "destructive",
      })
      router.push("/products")
      return
    }

    // Pre-fill email if user is logged in
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }))
    }

    // Store the current cart items if we're in the shipping step
    if (step === "shipping" && items.length > 0) {
      setCartItems(items)
    }
  }, [user, items, router, toast, cartLoading, orderCreated, step])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) return

    try {
      setLoading(true)

      // Save cart items before clearing
      const itemsToUse = [...cartItems]

      // Create a Payment Intent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToUse,
          userId: user.id,
          shippingAddress: formData,
          testMode: isTestMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to create payment intent")
      }

      // Mark that we've created an order to prevent redirection
      setOrderCreated(true)

      // Clear the cart immediately after order creation
      await clearCart()

      // Store the client secret and order ID for the payment step
      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)
      setStep("payment")

      toast({
        title: "Order created",
        description: "Your order has been created and requires payment to be completed.",
      })
    } catch (error: any) {
      console.error("Checkout error:", error)
      setError(error.message)
      toast({
        title: "Checkout failed",
        description: error.message || "There was an error processing your checkout.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't redirect if we've created an order and are in the payment step
  if (!user || (items.length === 0 && !cartLoading && step === "shipping" && !orderCreated)) {
    return null
  }

  if (cartLoading) {
    return (
      <div className="container py-8">
        <LoadingSpinner text="Loading cart..." />
      </div>
    )
  }

  // Get the current origin for success URL
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const returnUrl = `${origin}/checkout/success`

  return (
    <div className="container py-6 md:py-8 px-4 md:px-0">
      <PageHeader title="Checkout" />

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

      {error && <ErrorMessage message={error} className="mb-6" />}

      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <div>
          {step === "shipping" ? (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>Enter your shipping details to continue to payment.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitShipping}>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleChange} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : "Continue to Payment"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Shipping Information</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Name:</span> {formData.name}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {formData.email}
                      </p>
                      <p>
                        <span className="font-medium">Address:</span> {formData.address}
                      </p>
                      <p>
                        <span className="font-medium">City:</span> {formData.city}
                      </p>
                      <p>
                        <span className="font-medium">Postal Code:</span> {formData.postalCode}
                      </p>
                      <p>
                        <span className="font-medium">Country:</span> {formData.country}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h2 className="text-xl font-semibold mb-2">Payment Information</h2>
              {clientSecret && orderId ? (
                <PaymentFormWrapper clientSecret={clientSecret} returnUrl={returnUrl} orderId={orderId} />
              ) : (
                <LoadingSpinner text="Loading payment form..." />
              )}
            </>
          )}
        </div>

        <div>
          <OrderSummary
            items={step === "shipping" ? items : cartItems}
            totalPrice={
              step === "shipping" ? totalPrice : cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
            }
          />
        </div>
      </div>
    </div>
  )
}
