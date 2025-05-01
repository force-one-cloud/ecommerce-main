import { getSupabaseBrowserClient } from "./supabase"
import type { CartItem } from "@/components/cart-provider"

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed"
  | "payment_required"

export type Order = {
  id: string
  user_id: string
  status: OrderStatus
  total: number
  payment_intent_id?: string
  shipping_address?: any
  created_at: string
  updated_at?: string
  items: {
    id: string
    product_id: string
    name: string
    price: number
    quantity: number
    image?: string
  }[]
}

export async function createOrder(
  userId: string,
  items: CartItem[],
  total: number,
  paymentIntentId?: string,
  shippingAddress?: any,
): Promise<Order | null> {
  const supabase = getSupabaseBrowserClient()

  try {
    console.log("Creating order:", { userId, itemsCount: items.length, total, paymentIntentId })

    // 1. Create the order with status "payment_required" instead of "pending"
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total,
        payment_intent_id: paymentIntentId,
        shipping_address: shippingAddress,
        status: "payment_required", // Changed from "pending" to "payment_required"
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      throw orderError
    }

    console.log("Order created:", order.id)

    // 2. Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      throw itemsError
    }

    console.log("Order items created")

    // 3. Return the complete order with items
    return {
      ...order,
      items: items.map((item) => ({
        id: "", // We don't have the order_items.id yet
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    }
  } catch (error) {
    console.error("Error creating order:", error)
    return null
  }
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const supabase = getSupabaseBrowserClient()

  try {
    // 1. Get all orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (ordersError) throw ordersError
    if (!orders || orders.length === 0) return []

    // 2. For each order, get the order items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            product_id,
            quantity,
            price,
            products (
              name,
              image
            )
          `)
          .eq("order_id", order.id)

        if (itemsError) throw itemsError

        const items = orderItems.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          name: item.products.name,
          price: item.price,
          quantity: item.quantity,
          image: item.products.image,
        }))

        return {
          ...order,
          items,
        }
      }),
    )

    return ordersWithItems
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseBrowserClient()

  try {
    // 1. Get the order
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single()

    if (orderError) throw orderError

    // 2. Get the order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        product_id,
        quantity,
        price,
        products (
          name,
          image
        )
      `)
      .eq("order_id", id)

    if (itemsError) throw itemsError

    const items = orderItems.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      name: item.products.name,
      price: item.price,
      quantity: item.quantity,
      image: item.products.image,
    }))

    return {
      ...order,
      items,
    }
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error)
    return null
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()

  try {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error(`Error updating order status for id ${id}:`, error)
    return false
  }
}

export async function markOrderAsPaymentRequired(id: string): Promise<boolean> {
  return updateOrderStatus(id, "payment_required")
}

export async function cancelOrder(id: string): Promise<boolean> {
  return updateOrderStatus(id, "cancelled")
}

export async function markOrderAsFailed(id: string): Promise<boolean> {
  return updateOrderStatus(id, "failed")
}

export async function retryOrderPayment(orderId: string, userId: string): Promise<{ clientSecret: string } | null> {
  try {
    // Create a new payment intent for this order
    const response = await fetch("/api/retry-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.details || errorData.error || "Failed to create payment intent")
    }

    const data = await response.json()
    return { clientSecret: data.clientSecret }
  } catch (error) {
    console.error("Error retrying payment:", error)
    return null
  }
}
