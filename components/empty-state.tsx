import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink }: EmptyStateProps) {
  return (
    <div className="rounded-lg border p-6 md:p-8 text-center">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
      {actionLabel && actionLink && (
        <Link href={actionLink}>
          <Button className="mt-4">{actionLabel}</Button>
        </Link>
      )}
    </div>
  )
}
