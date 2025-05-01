"use client"

import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutCancelPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-md text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-3xl font-bold">Checkout Cancelled</h1>
        <p className="mt-4 text-muted-foreground">
          Your checkout process was cancelled. Your cart items are still saved.
        </p>
        <div className="mt-8 space-y-4">
          <Link href="/cart">
            <Button className="w-full">Return to Cart</Button>
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
