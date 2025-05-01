import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/orders"

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "processing":
        return "bg-blue-500 hover:bg-blue-600"
      case "shipped":
        return "bg-purple-500 hover:bg-purple-600"
      case "delivered":
        return "bg-green-500 hover:bg-green-600"
      case "cancelled":
        return "bg-red-500 hover:bg-red-600"
      case "failed":
        return "bg-red-500 hover:bg-red-600"
      case "payment_required":
        return "bg-orange-500 hover:bg-orange-600 animate-pulse" // Added animation to draw attention
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getStatusLabel = (status: OrderStatus) => {
    if (status === "payment_required") {
      return "Payment Required"
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
}
