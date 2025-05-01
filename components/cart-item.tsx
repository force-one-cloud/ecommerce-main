"use client"

import Image from "next/image"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CartItem as CartItemType } from "@/components/cart-provider"

interface CartItemProps {
  item: CartItemType
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}

export function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border p-4">
      <div className="h-20 w-20 overflow-hidden rounded-md shrink-0">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          width={80}
          height={80}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <Button variant="outline" size="icon" onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}>
          -
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button variant="outline" size="icon" onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}>
          +
        </Button>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(item.product_id)} className="mt-2 sm:mt-0">
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  )
}
