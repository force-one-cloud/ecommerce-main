import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get the request headers
  const headers = {
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    referer: request.headers.get("referer"),
  }

  // Return environment information
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
    stripePublishableKeyExists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    testModeEnabled: process.env.NEXT_PUBLIC_CHECKOUT_TEST_MODE === "true",
    headers,
  })
}
