"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, Archive } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function JobLifecycleManager({ 
  jobId, 
  jobTitle, 
  currentStatus, 
  acceptedWorkers = [],
  canComplete = false,
  canArchive = false 
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(null) // 'complete', 'cancel', 'archive'
  const router = useRouter()

  const handleStatusUpdate = async (newStatus, action) => {
    setIsUpdating(true)

    try {
      const supabase = createClient()

      // Update job status
      const { error } = await supabase
        .from("jobs")
        .update({ 
          status: newStatus
        })
        .eq("id", jobId)

      if (error) throw error

      console.log(`[JobLifecycle] Job ${action}:`, jobId)
      
      // Show success message based on action
      const messages = {
        complete: "🎉 Job marked as completed! Workers have been notified.",
        cancel: "❌ Job cancelled. Accepted workers have been notified.",
        archive: "📁 Job archived and moved to history."
      }
      
      alert(messages[action] || "Job status updated successfully!")
      router.refresh()
    } catch (error) {
      console.error(`[JobLifecycle] Failed to ${action} job:`, error)
      alert(`Failed to ${action} job. Please try again.`)
    } finally {
      setIsUpdating(false)
      setShowConfirmation(null)
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-800', 
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Completed'
        }
      case 'cancelled':
        return { 
          color: 'bg-red-100 text-red-800', 
          icon: <XCircle className="w-4 h-4" />,
          text: 'Cancelled'
        }
      case 'in_progress':
        return { 
          color: 'bg-blue-100 text-blue-800', 
          icon: <Clock className="w-4 h-4" />,
          text: 'In Progress'
        }
      case 'assigned':
        return { 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: <Clock className="w-4 h-4" />,
          text: 'Assigned'
        }
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <Clock className="w-4 h-4" />,
          text: 'Open'
        }
    }
  }

  const statusInfo = getStatusInfo(currentStatus)

  if (!showConfirmation) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              {statusInfo.icon}
              Job Lifecycle Management
            </h4>
            <p className="text-blue-600 text-sm">
              This job has hired workers. Choose the appropriate action:
            </p>
          </div>
          <Badge className={`${statusInfo.color} flex items-center gap-1`}>
            {statusInfo.icon}
            {statusInfo.text}
          </Badge>
        </div>

        {/* Hired Workers Info */}
        {acceptedWorkers.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h5 className="font-medium text-green-800 mb-2">
              ✅ Hired Workers ({acceptedWorkers.length})
            </h5>
            <div className="space-y-1">
              {acceptedWorkers.map((worker, index) => (
                <div key={index} className="text-green-700 text-sm">
                  • {worker.full_name} {worker.rating && `(⭐ ${worker.rating.toFixed(1)})`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {(currentStatus === 'assigned' || currentStatus === 'in_progress') && (
            <Button
              onClick={() => setShowConfirmation('complete')}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              disabled={isUpdating}
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Completed
            </Button>
          )}

          {(currentStatus === 'assigned' || currentStatus === 'in_progress') && (
            <Button
              onClick={() => setShowConfirmation('cancel')}
              variant="destructive"
              className="flex items-center gap-2"
              disabled={isUpdating}
            >
              <XCircle className="w-4 h-4" />
              Cancel Job
            </Button>
          )}

          {(currentStatus === 'completed' || currentStatus === 'cancelled') && (
            <Button
              onClick={() => setShowConfirmation('archive')}
              variant="outline"
              className="flex items-center gap-2 border-gray-400"
              disabled={isUpdating}
            >
              <Archive className="w-4 h-4" />
              Archive Job
            </Button>
          )}

          {currentStatus === 'assigned' && (
            <Button
              onClick={() => setShowConfirmation('progress')}
              variant="outline"
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              disabled={isUpdating}
            >
              <Clock className="w-4 h-4" />
              Mark In Progress
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Confirmation Dialog
  const confirmationContent = {
    complete: {
      title: "✅ Complete Job",
      message: `Mark "${jobTitle}" as completed?`,
      description: "This indicates that all work has been finished successfully. Workers will be notified and can request payment.",
      action: "complete",
      buttonText: "Yes, Complete Job",
      buttonClass: "bg-green-600 hover:bg-green-700"
    },
    cancel: {
      title: "❌ Cancel Job", 
      message: `Cancel "${jobTitle}"?`,
      description: "This will cancel the job. Hired workers will be notified. Consider completing the job instead if work was done.",
      action: "cancel",
      buttonText: "Yes, Cancel Job",
      buttonClass: "bg-red-600 hover:bg-red-700"
    },
    archive: {
      title: "📁 Archive Job",
      message: `Archive "${jobTitle}"?`,
      description: "This will move the job to your history. It will no longer appear in active job lists but can be viewed in archived jobs.",
      action: "archive",
      buttonText: "Yes, Archive Job", 
      buttonClass: "bg-gray-600 hover:bg-gray-700"
    },
    progress: {
      title: "🔄 Mark In Progress",
      message: `Mark "${jobTitle}" as in progress?`,
      description: "This indicates that hired workers have started working on the job.",
      action: "progress",
      buttonText: "Yes, Mark In Progress",
      buttonClass: "bg-blue-600 hover:bg-blue-700"
    }
  }

  const config = confirmationContent[showConfirmation]
  
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-4 shadow-lg">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{config.title}</h3>
          <p className="text-gray-700 mb-2">{config.message}</p>
          <p className="text-gray-600 text-sm mb-4">{config.description}</p>

          <div className="flex space-x-3">
            <Button
              onClick={() => handleStatusUpdate(
                showConfirmation === 'complete' ? 'completed' :
                showConfirmation === 'cancel' ? 'cancelled' :
                showConfirmation === 'progress' ? 'in_progress' :
                'archived',
                config.action
              )}
              className={`${config.buttonClass} text-white flex items-center gap-2`}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                config.buttonText
              )}
            </Button>
            <Button
              onClick={() => setShowConfirmation(null)}
              variant="outline"
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
