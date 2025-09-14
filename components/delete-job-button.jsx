"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const [askingCompletion, setAskingCompletion] = useState(false)
  const router = useRouter()

  const handleDelete = async (markCompleted = false) => {
    setIsDeleting(true)

    try {
      const supabase = createClient()

      // If we need to mark as completed first
      if (markCompleted) {
        const { error: statusError } = await supabase
          .from("jobs")
          .update({ 
            status: 'completed'
          })
          .eq("id", jobId)

        if (statusError) {
          console.error("Error updating job status:", statusError)
          throw statusError
        }
      }

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
      
      // Show success message
      if (markCompleted) {
        alert("✅ Job marked as completed and deleted successfully!")
      }
      
      // Redirect to dashboard
      router.push("/dashboard?deleted=true")
    } catch (error) {
      console.error("[DeleteJob] Failed to delete job:", error)
      alert("Failed to delete job. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowConfirmation(false)
      setAskingCompletion(false)
    }
  }

  const handleInitialClick = () => {
    if (hasAcceptedApplications) {
      setAskingCompletion(true)
    } else {
      setShowConfirmation(true)
    }
  }

  // Initial button
  if (!showConfirmation && !askingCompletion) {
    return (
      <Button
        onClick={handleInitialClick}
        variant="destructive"
        size="sm"
        className="flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete Job
      </Button>
    )
  }

  // Ask about work completion for jobs with hired workers
  if (askingCompletion) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Work Completion Check</h3>
            <p className="text-blue-700 mb-3">
              This job has hired workers. Has the work been completed?
            </p>
            
            {acceptedWorkers.length > 0 && (
              <div className="mb-3 bg-white border border-blue-200 rounded-lg p-3">
                <h5 className="font-medium text-blue-800 mb-2">
                  ✅ Hired Workers ({acceptedWorkers.length})
                </h5>
                <div className="space-y-1">
                  {acceptedWorkers.map((worker, index) => (
                    <div key={index} className="text-blue-700 text-sm">
                      • {worker.full_name} {worker.rating && `(⭐ ${worker.rating.toFixed(1)})`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => handleDelete(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                disabled={isDeleting}
              >
                <CheckCircle className="w-4 h-4" />
                {isDeleting ? "Completing & Deleting..." : "Yes, Work Completed - Delete"}
              </Button>
              <Button
                onClick={() => setAskingCompletion(false)}
                variant="outline"
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

  // Regular delete confirmation for jobs without hired workers
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
              onClick={() => handleDelete(false)}
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
