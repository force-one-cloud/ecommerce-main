"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingBag, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { CartItem } from "@/components/cart-item"
import { OrderSummary } from "@/components/order-summary"
import { PageHeader } from "@/components/page-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    loading,
    offlineMode,
    networkStatus,
    pendingSync,
    syncOfflineCart,
  } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Don't redirect if offline - allow viewing the offline cart without signing in
    if (!user && !offlineMode) {
      toast({
        title: "Sign in to save your cart",
        description: "Your cart will be saved to your account when you sign in.",
      })
      // Don't force redirect - allow viewing the offline cart
    }
  }, [user, router, toast, offlineMode])

  if (loading) {
    return (
      <div className="container py-8">
        <LoadingSpinner text="Loading cart..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 md:px-6">
      <PageHeader title="Your Cart" />

      {offlineMode && (
        <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            You can continue adding items to your cart, but you'll need to be online to checkout.
            {user && pendingSync && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-amber-100 dark:bg-amber-900 border-amber-300 dark:border-amber-700"
                  onClick={syncOfflineCart}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Cart Now
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          actionLabel="Browse Products"
          actionLink="/products"
        />
      ) : (
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} onRemove={removeItem} onUpdateQuantity={updateQuantity} />
            ))}
          </div>
          <div>
            <OrderSummary items={items} totalPrice={totalPrice}>
              <Link href="/checkout">
                <Button className="mt-6 w-full" disabled={offlineMode}>
                  {offlineMode ? "Need to be online to checkout" : "Proceed to Checkout"}
                </Button>
              </Link>
            </OrderSummary>
          </div>
        </div>
      )}
    </div>
  )
}
