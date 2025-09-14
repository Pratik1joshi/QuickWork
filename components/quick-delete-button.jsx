"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function QuickDeleteButton({ 
  jobId, 
  jobTitle, 
  jobStatus = "open",
  hasAcceptedApplications = false, 
  size = "sm" 
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  // If job has hired workers, show management button instead
  if (hasAcceptedApplications) {
    return (
      <Button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(`/jobs/${jobId}/manage`)
        }}
        variant="outline"
        size={size}
        className="flex items-center gap-1 border-blue-400 text-blue-600 hover:bg-blue-50"
        title="Manage job lifecycle (workers hired)"
      >
        <Settings className="w-3 h-3" />
        Manage
      </Button>
    )
  }

  const handleQuickDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Show confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete "${jobTitle}"?\n\n⚠️ This action cannot be undone and will delete all applications.`
    )

    if (!confirmed) return

    setIsDeleting(true)

    try {
      const supabase = createClient()

      // Delete all job applications first
      const { error: applicationsError } = await supabase
        .from("job_applications")
        .delete()
        .eq("job_id", jobId)

      if (applicationsError) throw applicationsError

      // Then delete the job
      const { error: jobError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)

      if (jobError) throw jobError

      console.log("[QuickDelete] Job deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("[QuickDelete] Failed to delete job:", error)
      alert("Failed to delete job. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      onClick={handleQuickDelete}
      variant="destructive"
      size={size}
      disabled={isDeleting}
      className="flex items-center gap-1"
      title="Delete job permanently"
    >
      <Trash2 className="w-3 h-3" />
      {isDeleting ? "..." : "Delete"}
    </Button>
  )
}
