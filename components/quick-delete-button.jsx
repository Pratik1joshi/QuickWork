"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, CheckCircle } from "lucide-react"
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

  const handleQuickDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    let confirmed = false
    let markCompleted = false

    if (hasAcceptedApplications) {
      // Ask if work is completed for jobs with hired workers
      confirmed = window.confirm(
        `"${jobTitle}" has hired workers.\n\nHas the work been completed?\n\n` +
        `✅ Click OK if work is COMPLETED (will mark as completed and delete)\n` +
        `❌ Click Cancel to keep the job`
      )
      markCompleted = true
    } else {
      // Regular confirmation for jobs without hired workers
      confirmed = window.confirm(
        `Are you sure you want to delete "${jobTitle}"?\n\n⚠️ This action cannot be undone and will delete all applications.`
      )
    }

    if (!confirmed) return

    setIsDeleting(true)

    try {
      const supabase = createClient()

      // If we need to mark as completed first
      if (markCompleted) {
        const { error: statusError } = await supabase
          .from("jobs")
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq("id", jobId)

        if (statusError) throw statusError
      }

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
      
      if (markCompleted) {
        alert("✅ Job marked as completed and deleted!")
      }
      
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
      title={hasAcceptedApplications ? "Delete job (will ask about completion)" : "Delete job permanently"}
    >
      {hasAcceptedApplications ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      {isDeleting ? "..." : "Delete"}
    </Button>
  )
}
