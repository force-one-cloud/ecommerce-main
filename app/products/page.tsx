import { getProducts } from "@/lib/products"
import { ProductCard } from "@/components/product-card"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="container py-6 md:py-8 px-4 md:px-0">
      <PageHeader title="All Products" />

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No products found</AlertTitle>
          <AlertDescription>We couldn't find any products. Please check back later.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
