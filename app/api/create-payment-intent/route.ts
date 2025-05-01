import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createOrder } from "@/lib/orders"
import type { CartItem } from "@/components/cart-provider"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY)
    console.log("Test mode enabled:", process.env.NEXT_PUBLIC_CHECKOUT_TEST_MODE === "true")

    const body = await request.json()
    const { items, userId, shippingAddress, testMode, clearCartFunction } = body

    console.log("Request payload:", {
      itemsCount: items?.length,
      userId: userId ? "exists" : "missing",
      shippingAddress: shippingAddress ? "exists" : "missing",
      testMode,
    })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Calculate total
    const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)
    const amount = Math.round(total * 100) // Stripe uses cents

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId,
        testMode: testMode ? "true" : "false",
      },
    })

    console.log("Payment Intent created:", paymentIntent.id)

    // Create order in our database
    const order = await createOrder(userId, items, total, paymentIntent.id, shippingAddress)

    if (!order) {
      console.error("Failed to create order in database")
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Clear the cart immediately after order creation
    // This is now handled client-side in the checkout page

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error("Error creating payment intent:", error.message, error.stack)
    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
