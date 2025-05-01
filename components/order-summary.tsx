import type React from "react"
import type { CartItem } from "@/components/cart-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface OrderSummaryProps {
  items: CartItem[]
  totalPrice: number
  showCheckoutButton?: boolean
  children?: React.ReactNode
}

export function OrderSummary({ items, totalPrice, showCheckoutButton = false, children }: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your order before proceeding to payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span className="line-clamp-1">
              {item.name} x {item.quantity}
            </span>
            <span className="ml-2 shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
