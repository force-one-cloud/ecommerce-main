import type React from "react"
import { format } from "date-fns"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/order-status-badge"
import type { Order } from "@/lib/orders"

interface OrderDetailsProps {
  order: Order
  showActions?: boolean
  actions?: React.ReactNode
}

export function OrderDetails({ order, showActions = false, actions }: OrderDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
            <CardDescription>Placed on {format(new Date(order.created_at), "PPP")}</CardDescription>
            {order.updated_at && (
              <CardDescription>Last updated: {format(new Date(order.updated_at), "PPP")}</CardDescription>
            )}
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {order.shipping_address && (
            <div>
              <h3 className="font-semibold">Shipping Address</h3>
              <div className="mt-1 text-sm">
                <p>{order.shipping_address.name}</p>
                <p>{order.shipping_address.address}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.postalCode}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold">Items</h3>
            <div className="mt-2 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-md shrink-0">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>

          {showActions && actions && <div className="pt-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
