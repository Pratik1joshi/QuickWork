"use client"

import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function JobStatusManager({ jobId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus || "open")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Prevent hydration mismatch by only rendering interactive elements after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", jobId)

      if (error) throw error

      setStatus(newStatus)
      console.log("[JobStatusManager] Job status updated to:", newStatus)
      router.refresh()
    } catch (error) {
      console.error("[JobStatusManager] Failed to update job status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-2">
      <Badge className={getStatusColor(status)}>{status ? status.replace("_", " ") : "Unknown"}</Badge>

      {/* Only render Select after component is mounted to prevent hydration mismatch */}
      {isMounted ? (
        <Select value={status} onValueChange={handleStatusChange} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex h-11 w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900">
          {status ? status.replace("_", " ") : "Unknown"}
        </div>
      )}
    </div>
  )
}
