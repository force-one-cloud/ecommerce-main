"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WifiOff } from "lucide-react"

export default function ProductPage() {
  const params = useParams()
  const { addItem, offlineMode } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single()

        if (error) throw error

        if (data) {
          setProduct(data)
        } else {
          router.push("/404")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        router.push("/404")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, supabase, router])

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[50vh]">
        <p>Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const handleAddToCart = () => {
    // Allow adding to cart without signing in - the cart provider will handle offline storage
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 md:px-6">
      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={600}
            height={600}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-xl md:text-2xl font-semibold">${product.price.toFixed(2)}</p>
          </div>
          <p className="text-muted-foreground">{product.description}</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </Button>
              <span>{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                +
              </Button>
            </div>
            <Button className="w-full" size="lg" onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </div>
          {offlineMode && (
            <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertTitle>You're offline</AlertTitle>
              <AlertDescription>
                You can add items to your cart while offline. They will be saved to your account when you sign in
                online.
              </AlertDescription>
            </Alert>
          )}
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <h3 className="font-medium">Product Details</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>Category: {product.category}</li>
              <li>In Stock: {product.stock} units</li>
              <li>Free shipping on orders over $50</li>
              <li>30-day money-back guarantee</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
