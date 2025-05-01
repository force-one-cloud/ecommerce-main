"use client"

import type React from "react"
import { createContext, useEffect, useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export type CartItem = {
  id: string
  product_id: string
  name: string
  price: number
  image: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "id" | "quantity">) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  loading: boolean
  offlineMode: boolean
  networkStatus: "online" | "offline"
  pendingSync: boolean
  syncOfflineCart: () => Promise<void>
}

export const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  loading: true,
  offlineMode: false,
  networkStatus: "online",
  pendingSync: false,
  syncOfflineCart: async () => {},
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [offlineMode, setOfflineMode] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online")
  const [pendingSync, setPendingSync] = useState(false)

  const saveToLocalStorage = useCallback((items: CartItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("offlineCart", JSON.stringify(items))
    }
  }, [])

  const loadFromLocalStorage = useCallback((): CartItem[] => {
    if (typeof window !== "undefined") {
      const storedCart = localStorage.getItem("offlineCart")
      return storedCart ? JSON.parse(storedCart) : []
    }
    return []
  }, [])

  const clearLocalStorageCart = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("offlineCart")
    }
  }, [])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online")
      setOfflineMode(false)

      // If we have a user and pending sync, sync the cart
      if (user && pendingSync) {
        syncOfflineCart()
      }
    }

    const handleOffline = () => {
      setNetworkStatus("offline")
      setOfflineMode(true)
      toast({
        title: "You're offline",
        description: "You can still add items to your cart. They will be synced when you're back online.",
      })
    }

    // Check initial status
    setNetworkStatus(navigator.onLine ? "online" : "offline")
    setOfflineMode(!navigator.onLine)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [user, pendingSync, toast])

  // Listen for sign-in events to trigger cart sync
  useEffect(() => {
    const handleUserSignedIn = () => {
      console.log("User signed in event detected, checking for offline cart items")
      const localItems = loadFromLocalStorage()
      if (localItems.length > 0 && user) {
        console.log("Found offline items to sync after sign in:", localItems.length)
        syncOfflineCartToAccount(localItems)
      }
    }

    window.addEventListener("user-signed-in", handleUserSignedIn)

    return () => {
      window.removeEventListener("user-signed-in", handleUserSignedIn)
    }
  }, [user, loadFromLocalStorage])

  // Sync offline cart with user's cart
  const syncOfflineCart = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to sync your offline cart with your account.",
      })
      return
    }

    const offlineItems = loadFromLocalStorage()
    await syncOfflineCartToAccount(offlineItems)
  }

  // Sync offline cart with user's account - specifically for sign-in
  const syncOfflineCartToAccount = async (offlineItems: CartItem[]) => {
    if (!user || offlineItems.length === 0) return

    try {
      console.log("Syncing offline cart to account:", offlineItems.length, "items")
      setLoading(true)

      // First, get all existing cart items for this user
      const { data: existingItems, error: fetchError } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity")
        .eq("user_id", user.id)

      if (fetchError) {
        console.error("Error fetching existing cart items:", fetchError)
        throw fetchError
      }

      // Create a map of product_id to existing item for quick lookup
      const existingItemsMap = new Map()
      existingItems?.forEach((item) => {
        existingItemsMap.set(item.product_id, item)
      })

      // Process each offline item
      for (const item of offlineItems) {
        const existingItem = existingItemsMap.get(item.product_id)

        if (existingItem) {
          // Update quantity if item exists
          const newQuantity = existingItem.quantity + item.quantity
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({ quantity: newQuantity })
            .eq("id", existingItem.id)

          if (updateError) {
            console.error("Error updating cart item quantity:", updateError)
            continue
          }
        } else {
          // Insert new item if it doesn't exist
          const { error: insertError } = await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.product_id,
            quantity: item.quantity,
          })

          if (insertError) {
            console.error("Error inserting new cart item:", insertError)
            continue
          }
        }
      }

      // Clear offline cart
      clearLocalStorageCart()
      setPendingSync(false)

      // Refresh the cart items from the database
      const { data: updatedCart, error: refreshError } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price,
            image
          )
        `)
        .eq("user_id", user.id)

      if (refreshError) {
        console.error("Error refreshing cart after sync:", refreshError)
      } else if (updatedCart) {
        const cartItems = updatedCart.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image,
          quantity: item.quantity,
        }))

        setItems(cartItems)
      }

      toast({
        title: "Cart synced",
        description: "Your offline cart has been added to your account.",
      })
    } catch (error) {
      console.error("Error syncing offline cart to account:", error)
      setPendingSync(true) // Keep trying
    } finally {
      setLoading(false)
    }
  }

  // Load cart from Supabase when user changes
  useEffect(() => {
    let mounted = true

    const fetchCart = async () => {
      // Check if we have offline items to sync when a user signs in
      const localItems = loadFromLocalStorage()

      if (!user) {
        // If no user, just use local storage items
        setItems(localItems)
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // If we have offline items and a user just signed in, mark for sync
        if (localItems.length > 0) {
          setPendingSync(true)

          // Attempt to sync immediately if online
          if (networkStatus === "online") {
            await syncOfflineCartToAccount(localItems)
          }
        }

        // Then fetch the user's server cart
        const { data, error } = await supabase
          .from("cart_items")
          .select(`
            id,
            product_id,
            quantity,
            products (
              name,
              price,
              image
            )
          `)
          .eq("user_id", user.id)

        if (error) {
          throw error
        }

        if (data && mounted) {
          const cartItems = data.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            name: item.products.name,
            price: item.products.price,
            image: item.products.image,
            quantity: item.quantity,
          }))

          setItems(cartItems)
        }
      } catch (error) {
        console.error("Error fetching cart:", error)
        toast({
          title: "Failed to load cart",
          description: "There was an error loading your cart items.",
          variant: "destructive",
        })
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchCart()

    return () => {
      mounted = false
    }
  }, [user, supabase, toast, loadFromLocalStorage, networkStatus])

  const addItem = async (item: Omit<CartItem, "id" | "quantity">) => {
    // If offline or no user, add to local storage
    if (offlineMode || !user) {
      const localItems = loadFromLocalStorage()
      const existingItemIndex = localItems.findIndex((i) => i.product_id === item.product_id)

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        localItems[existingItemIndex].quantity += 1
      } else {
        // Add new item
        localItems.push({
          id: `local-${Date.now()}`,
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        })
      }

      // Save to local storage
      saveToLocalStorage(localItems)

      // Update state
      setItems(localItems)

      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your offline cart.`,
      })

      if (!user) {
        toast({
          title: "Sign in to save your cart",
          description: "Your cart will be saved to your account when you sign in.",
        })
      }

      return
    }

    try {
      // Check if item already exists in cart
      const existingItemIndex = items.findIndex((i) => i.product_id === item.product_id)

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const newQuantity = items[existingItemIndex].quantity + 1

        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("user_id", user.id)
          .eq("product_id", item.product_id)

        if (error) throw error

        // Update local state
        const updatedItems = [...items]
        updatedItems[existingItemIndex].quantity = newQuantity
        setItems(updatedItems)
      } else {
        // Insert new item if it doesn't exist
        const { data, error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: item.product_id,
            quantity: 1,
          })
          .select()

        if (error) throw error

        if (data && data[0]) {
          // Add new item to local state
          setItems([
            ...items,
            {
              id: data[0].id,
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              image: item.image,
              quantity: 1,
            },
          ])
        }
      }

      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("Error adding item to cart:", error)
      toast({
        title: "Failed to add item",
        description: "There was an error adding this item to your cart.",
        variant: "destructive",
      })
    }
  }

  const removeItem = async (productId: string) => {
    if (offlineMode || !user) {
      const localItems = loadFromLocalStorage()
      const updatedItems = localItems.filter((i) => i.product_id !== productId)

      // Save to local storage
      saveToLocalStorage(updatedItems)

      // Update state
      setItems(updatedItems)

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your offline cart.",
      })

      return
    }

    try {
      const itemToRemove = items.find((i) => i.product_id === productId)

      if (!itemToRemove) return

      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId)

      if (error) throw error

      // Update local state
      setItems(items.filter((i) => i.product_id !== productId))

      toast({
        title: "Removed from cart",
        description: `${itemToRemove.name} has been removed from your cart.`,
      })
    } catch (error) {
      console.error("Error removing item from cart:", error)
      toast({
        title: "Failed to remove item",
        description: "There was an error removing this item from your cart.",
        variant: "destructive",
      })
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return

    if (offlineMode || !user) {
      const localItems = loadFromLocalStorage()
      const itemIndex = localItems.findIndex((i) => i.product_id === productId)

      if (itemIndex >= 0) {
        localItems[itemIndex].quantity = quantity

        // Save to local storage
        saveToLocalStorage(localItems)

        // Update state
        setItems([...localItems])
      }

      return
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (error) throw error

      // Update local state
      setItems(items.map((item) => (item.product_id === productId ? { ...item, quantity } : item)))
    } catch (error) {
      console.error("Error updating item quantity:", error)
      toast({
        title: "Failed to update quantity",
        description: "There was an error updating the quantity.",
        variant: "destructive",
      })
    }
  }

  const clearCart = async () => {
    if (offlineMode || !user) {
      // Clear local storage
      clearLocalStorageCart()

      // Update state
      setItems([])

      toast({
        title: "Cart cleared",
        description: "All items have been removed from your offline cart.",
      })

      return
    }

    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

      if (error) throw error

      // Update local state
      setItems([])

      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      })
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast({
        title: "Failed to clear cart",
        description: "There was an error clearing your cart.",
      })
    }
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loading,
        offlineMode,
        networkStatus,
        pendingSync,
        syncOfflineCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
