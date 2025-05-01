"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Package, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/page-header"

export default function AccountPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to view your account.",
        variant: "destructive",
      })
      router.push("/signin")
    }
  }, [user, router, toast])

  if (!user) {
    return null
  }

  return (
    <div className="container py-6 md:py-8 px-4 md:px-0">
      <PageHeader title="My Account" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>View and update your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Link href="/account/profile">
              <Button className="mt-4" variant="outline">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View your order history and track shipments.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Order History</h3>
            <p className="text-sm text-muted-foreground">Track and manage your orders</p>
            <Link href="/account/orders">
              <Button className="mt-4" variant="outline">
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shopping</CardTitle>
            <CardDescription>Continue shopping or view your cart.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Shopping Cart</h3>
            <p className="text-sm text-muted-foreground">View and manage your cart</p>
            <Link href="/cart">
              <Button className="mt-4" variant="outline">
                Go to Cart
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
