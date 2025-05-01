import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  title?: string
  message: string
  className?: string
}

export function ErrorMessage({ title = "Error", message, className = "" }: ErrorMessageProps) {
  return (
    <div
      className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-1">{message}</p>
    </div>
  )
}
