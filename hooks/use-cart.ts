"use client"

import { useContext } from "react"
import { CartContext } from "@/components/cart-provider"
import type { CartItem } from "@/components/cart-provider"

export type { CartItem }

export function useCart() {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}
