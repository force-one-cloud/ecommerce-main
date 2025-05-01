import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    console.error("No sessionId provided in checkout redirect")
    // Get the origin from the request
    const origin = request.headers.get("origin") || request.nextUrl.origin
    return NextResponse.redirect(`${origin}/checkout/cancel`)
  }

  try {
    console.log("Retrieving Stripe session:", sessionId)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.url) {
      console.log("Redirecting to Stripe checkout URL:", session.url)
      return NextResponse.redirect(session.url)
    } else {
      console.error("No URL found in Stripe session")
      // Get the origin from the request
      const origin = request.headers.get("origin") || request.nextUrl.origin
      return NextResponse.redirect(`${origin}/checkout/cancel`)
    }
  } catch (error: any) {
    console.error("Error retrieving checkout session:", error.message, error.stack)
    // Get the origin from the request
    const origin = request.headers.get("origin") || request.nextUrl.origin
    return NextResponse.redirect(`${origin}/checkout/cancel`)
  }
}
