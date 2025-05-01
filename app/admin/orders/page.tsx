"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { format } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { OrderStatusBadge } from "@/components/order-status-badge"
import type { Order, OrderStatus } from "@/lib/orders"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const userFilter = searchParams.get("user")

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterUser, setFilterUser] = useState<{ id: string; name: string } | null>(null)
  const itemsPerPage = 10
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // If there's a user filter in the URL, fetch the user details
    if (userFilter) {
      fetchUserDetails(userFilter)
    }
  }, [userFilter])

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchQuery, statusFilter, filterUser])

  const fetchUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("id, name").eq("id", userId).single()

      if (error) throw error

      if (data) {
        setFilterUser({
          id: data.id,
          name: data.name,
        })
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)

      // Calculate range for pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      let query = supabase
        .from("orders")
        .select(
          `
          *,
          users (
            name,
            email
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      // Add status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      // Add user filter if present
      if (filterUser) {
        query = query.eq("user_id", filterUser.id)
      }

      // Add search filter if query exists
      if (searchQuery) {
        query = query.or(
          `id.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%,users.name.ilike.%${searchQuery}%`,
        )
      }

      const { data, count, error } = await query

      if (error) throw error

      // For each order, get the order items
      const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
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
            user: {
              name: order.users?.name || "Unknown",
              email: order.users?.email || "Unknown",
            },
          }
        }),
      )

      setOrders(ordersWithItems)

      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) throw error

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order,
        ),
      )

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const clearUserFilter = () => {
    setFilterUser(null)
    window.history.pushState({}, "", "/admin/orders")
  }

  const statusOptions: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "failed",
    "payment_required",
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {filterUser && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Filtering orders for user: <span className="text-blue-600 dark:text-blue-400">{filterUser.name}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearUserFilter}>
              <X className="h-4 w-4 mr-2" />
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by order ID or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading orders..." />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          #{order.id.substring(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{order.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink isActive={page === currentPage} onClick={() => setCurrentPage(page)}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
