"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { JobLifecycleManager } from "@/components/job-lifecycle-manager"

export function DeleteJobButton({ 
  jobId, 
  jobTitle, 
  jobStatus = "open",
  applicationCount = 0, 
  hasAcceptedApplications = false,
  acceptedWorkers = []
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const router = useRouter()

  // If job has hired workers, show lifecycle manager instead
  if (hasAcceptedApplications) {
    return (
      <JobLifecycleManager
        jobId={jobId}
        jobTitle={jobTitle}
        currentStatus={jobStatus}
        acceptedWorkers={acceptedWorkers}
        canComplete={true}
        canArchive={jobStatus === 'completed' || jobStatus === 'cancelled'}
      />
    )
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClient()

      // Delete all job applications first (due to foreign key constraints)
      const { error: applicationsError } = await supabase
        .from("job_applications")
        .delete()
        .eq("job_id", jobId)

      if (applicationsError) {
        console.error("Error deleting job applications:", applicationsError)
        throw applicationsError
      }

      // Then delete the job
      const { error: jobError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)

      if (jobError) {
        console.error("Error deleting job:", jobError)
        throw jobError
      }

      console.log("[DeleteJob] Job and applications deleted successfully")
      
      // Redirect to dashboard
      router.push("/dashboard?deleted=true")
    } catch (error) {
      console.error("[DeleteJob] Failed to delete job:", error)
      alert("Failed to delete job. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowConfirmation(false)
    }
  }

  if (!showConfirmation) {
    return (
      <Button
        onClick={() => setShowConfirmation(true)}
        variant="destructive"
        size="sm"
        className="flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete Job
      </Button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Job Confirmation</h3>
          <p className="text-red-700 mb-3">
            Are you sure you want to delete "{jobTitle}"? This action cannot be undone.
          </p>
          
          {applicationCount > 0 && (
            <div className="mb-3">
              <Badge variant="outline" className="text-red-600 border-red-300">
                {applicationCount} application{applicationCount !== 1 ? 's' : ''} will be deleted
              </Badge>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Yes, Delete Job"}
            </Button>
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="outline"
              size="sm"
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
