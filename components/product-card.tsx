import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div
        className={`group overflow-hidden rounded-lg border bg-background p-3 transition-colors hover:bg-accent h-full ${className}`}
      >
        <div className="aspect-square overflow-hidden rounded-md">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="pt-3">
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
        </div>
      </div>
    </Link>
  )
}
