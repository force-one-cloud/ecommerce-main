import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getOrderById, updateOrderStatus } from "@/lib/orders"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY)

    const body = await request.json()
    const { orderId, userId } = body

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get the order
    const order = await getOrderById(orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify the user owns this order
    if (order.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create a new Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Stripe uses cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId,
        orderId,
        retry: "true",
      },
    })

    console.log("New Payment Intent created for retry:", paymentIntent.id)

    // Update the order with the new payment intent ID and set status to payment_required
    await updateOrderStatus(orderId, "payment_required")

    // Update the payment_intent_id in the database
    const supabase = (await import("@/lib/supabase")).getSupabaseBrowserClient()
    await supabase
      .from("orders")
      .update({
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error("Error creating retry payment intent:", error.message, error.stack)
    return NextResponse.json(
      {
        error: "Failed to create retry payment intent",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
