import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getFeaturedProducts } from "@/lib/products"
import { ProductCard } from "@/components/product-card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function Home() {
  // Display featured products on the homepage
  const featuredProducts = await getFeaturedProducts(3)

  return (
    <div className="container py-6 md:py-8 space-y-8 md:space-y-12">
      <section className="space-y-4 md:space-y-6 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter">Welcome to E-Shop</h1>
        <p className="mx-auto max-w-[700px] text-base md:text-lg text-muted-foreground px-4 md:px-0">
          Shop the latest products with secure checkout and fast delivery.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4 md:px-0">
          <Link href="/products" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Shop Now
            </Button>
          </Link>
          <Link href="/account" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              My Account
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4 md:space-y-6 px-4 md:px-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Products</h2>
          <Link href="/products">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No products found</AlertTitle>
            <AlertDescription>We couldn't find any featured products. Please check back later.</AlertDescription>
          </Alert>
        )}
      </section>

      <section className="rounded-lg bg-slate-50 p-4 md:p-8 dark:bg-slate-900 mx-4 md:mx-0">
        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Why Shop With Us?</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Fast & secure checkout</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Free shipping on orders over $50</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>30-day money-back guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>24/7 customer support</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <Image src="/diverse-people-shopping.png" alt="Shopping" width={300} height={300} className="rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  )
}
