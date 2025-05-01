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
    // Log environment variables (without exposing the full key)
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY)
    console.log("Test mode enabled:", process.env.NEXT_PUBLIC_CHECKOUT_TEST_MODE === "true")

    const body = await request.json()
    const { items, userId, shippingAddress, testMode, successUrl, cancelUrl } = body

    console.log("Request payload:", {
      itemsCount: items?.length,
      userId: userId ? "exists" : "missing",
      shippingAddress: shippingAddress ? "exists" : "missing",
      testMode,
      successUrl: successUrl ? "provided" : "missing",
      cancelUrl: cancelUrl ? "provided" : "missing",
    })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Success and cancel URLs are required" }, { status: 400 })
    }

    // Create line items for Stripe
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }))

    // Calculate total
    const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)

    // Log the URLs we're about to use
    console.log("Stripe session URLs:", {
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        testMode: testMode ? "true" : "false",
      },
    })

    console.log("Stripe session created:", session.id)

    // Create order in our database
    const order = await createOrder(userId, items, total, session.id, shippingAddress)

    if (!order) {
      console.error("Failed to create order in database")
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    return NextResponse.json({ sessionId: session.id, orderId: order.id })
  } catch (error: any) {
    console.error("Error creating checkout session:", error.message,error, error.stack)
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
