"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/components/toast"

// Function to send automatic congratulations message
const sendCongratulationsMessage = async (supabase, applicationId, employerId, applicantName) => {
  try {
    console.log("[ApplicationActions] Sending congratulations message for application:", applicationId)
    
    // Get employer's name for a more personalized message
    const { data: employerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", employerId)
      .single()
    
    const employerName = employerProfile?.full_name || "Your employer"
    
    // First, get or create a conversation for this application
    let conversationId
    
    // Check if conversation already exists
    const { data: existingConversation, error: convSearchError } = await supabase
      .from("conversations")
      .select("id")
      .eq("application_id", applicationId)
      .single()
    
    if (existingConversation) {
      conversationId = existingConversation.id
      console.log("[ApplicationActions] Using existing conversation:", conversationId)
    } else {
      // Create new conversation
      const { data: newConversation, error: convCreateError } = await supabase
        .from("conversations")
        .insert({ application_id: applicationId })
        .select("id")
        .single()
      
      if (convCreateError) {
        console.error("[ApplicationActions] Error creating conversation:", convCreateError)
        return
      }
      
      conversationId = newConversation.id
      console.log("[ApplicationActions] Created new conversation:", conversationId)
    }
    
    // Send the congratulations message
    const congratsMessage = `🎉 Congratulations ${applicantName}! 

Your application has been ACCEPTED! Welcome to our team! 

We're excited to work with you and look forward to a successful collaboration. Please feel free to reach out if you have any questions.

Best regards,
${employerName}`
    
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: employerId,
        content: congratsMessage
      })
    
    if (messageError) {
      console.error("[ApplicationActions] Error sending congratulations message:", messageError)
    } else {
      console.log("[ApplicationActions] Congratulations message sent successfully")
    }
    
  } catch (error) {
    console.error("[ApplicationActions] Error in sendCongratulationsMessage:", error)
  }
}

export function ApplicationActions({ applicationId, jobId, workerId, workersNeeded = 1, acceptedCount = 0, applicantName = "this applicant", onStatusChange }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { openDialog, ConfirmDialog } = useConfirmDialog()
  const { addToast } = useToast()

  const canAcceptMore = acceptedCount < workersNeeded
  const spotsRemaining = workersNeeded - acceptedCount

  const handleAcceptClick = () => {
    openDialog({
      title: "Accept Application",
      message: `Are you sure you want to accept ${applicantName}? ${spotsRemaining === 1 ? 'This will fill the last available spot.' : `${spotsRemaining - 1} spots will remain after this.`}`,
      confirmText: "Accept",
      cancelText: "Cancel",
      type: "success",
      onConfirm: handleAccept
    })
  }

  const handleRejectClick = () => {
    openDialog({
      title: "Reject Application",
      message: `Are you sure you want to reject ${applicantName}? This action cannot be undone.`,
      confirmText: "Reject",
      cancelText: "Cancel", 
      type: "danger",
      onConfirm: handleReject
    })
  }

  const handleAccept = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Check current user
      const { data: { user } } = await supabase.auth.getUser()
      console.log("[ApplicationActions] Current user:", user?.id)
      
      console.log("[ApplicationActions] Starting accept process:", {
        applicationId,
        jobId,
        workerId,
        workersNeeded,
        acceptedCount,
        currentUserId: user?.id
      })

      // Check current application status first
      const { data: currentApp, error: readError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", applicationId)
        .single()

      if (readError) {
        console.error("[ApplicationActions] Error reading application:", readError)
      } else {
        console.log("[ApplicationActions] Current application full data:", currentApp)
        console.log("[ApplicationActions] Application belongs to job:", currentApp?.job_id)
        console.log("[ApplicationActions] Application worker:", currentApp?.worker_id)
        console.log("[ApplicationActions] Current user can read application:", !!currentApp)
      }

      // Step 1: Accept this application using the secure function
      console.log("[ApplicationActions] Attempting to update application using function:", applicationId)
      const { data: updateData, error: acceptError } = await supabase
        .rpc('update_application_status', {
          application_id: applicationId,
          new_status: 'accepted',
          employer_user_id: user?.id
        })

      console.log("[ApplicationActions] Function call result:", {
        data: updateData,
        error: acceptError
      })

      if (acceptError) {
        console.error("[ApplicationActions] Accept error details:", {
          message: acceptError.message,
          details: acceptError.details,
          hint: acceptError.hint,
          code: acceptError.code
        })
        throw acceptError
      }

      if (!updateData) {
        const errorMsg = "Function call completed but no data returned. This might be a permissions issue."
        console.error("[ApplicationActions]", errorMsg)
        throw new Error(errorMsg)
      }

      console.log("[ApplicationActions] Application accepted successfully:", updateData)

      // Send automatic congratulations message (don't let this fail the main operation)
      let messageSent = false
      try {
        await sendCongratulationsMessage(supabase, applicationId, user.id, applicantName)
        messageSent = true
      } catch (messageError) {
        console.error("[ApplicationActions] Failed to send congratulations message, but application was accepted:", messageError)
      }

      // Verify the update worked by checking again
      const { data: verifyApp, error: verifyError } = await supabase
        .from("job_applications")
        .select("status")
        .eq("id", applicationId)
        .single()

      if (verifyError) {
        console.error("[ApplicationActions] Verify error:", verifyError)
      } else {
        console.log("[ApplicationActions] Verified application status after update:", verifyApp?.status)
      }

      // Check all applications for this job to see the current state
      const { data: allApps } = await supabase
        .from("job_applications")
        .select("id, status")
        .eq("job_id", jobId)

      console.log("[ApplicationActions] All applications after update:", allApps)

      // Step 2: Check if we should update job status
      const newAcceptedCount = acceptedCount + 1
      console.log("[ApplicationActions] New accepted count:", newAcceptedCount, "of", workersNeeded)
      
      if (newAcceptedCount >= workersNeeded) {
        console.log("[ApplicationActions] Quota reached, rejecting other applications...")
        
        // Reject all remaining pending applications
        const { error: rejectError } = await supabase
          .from("job_applications")
          .update({ status: "rejected" })
          .eq("job_id", jobId)
          .eq("status", "pending")

        if (rejectError) {
          console.error("[ApplicationActions] Reject error:", rejectError)
        } else {
          console.log("[ApplicationActions] Other applications rejected")
        }

        // Update job status to assigned
        const { error: jobError } = await supabase
          .from("jobs")
          .update({ status: "assigned" })
          .eq("id", jobId)

        if (jobError) {
          console.error("[ApplicationActions] Job update error:", jobError)
        } else {
          console.log("[ApplicationActions] Job status updated to assigned")
        }

        addToast(`✅ ${applicantName} accepted! Job is now fully staffed.${messageSent ? ' 📨 Congratulations message sent!' : ''}`, "success")
      } else {
        addToast(`✅ ${applicantName} accepted! ${workersNeeded - newAcceptedCount} more worker(s) needed.${messageSent ? ' 📨 Congratulations message sent!' : ''}`, "success")
      }

      // Notify parent component about the status change instead of refreshing
      if (onStatusChange) {
        onStatusChange(applicationId, "accepted")
      }
      
    } catch (error) {
      console.error("[ApplicationActions] Failed to accept application:", error)
      addToast(`❌ Failed to accept application: ${error.message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log("[ApplicationActions] Rejecting application:", applicationId)

      const { data: updateData, error } = await supabase
        .rpc('update_application_status', {
          application_id: applicationId,
          new_status: 'rejected',
          employer_user_id: user?.id
        })

      if (error) {
        console.error("[ApplicationActions] Reject error:", error)
        throw error
      }

      console.log("[ApplicationActions] Application rejected successfully:", updateData)
      addToast(`❌ ${applicantName} application rejected.`, "warning")
      
      // Notify parent component about the status change instead of refreshing
      if (onStatusChange) {
        onStatusChange(applicationId, "rejected")
      }
      
    } catch (error) {
      console.error("[ApplicationActions] Failed to reject application:", error)
      addToast(`❌ Failed to reject application: ${error.message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={handleAcceptClick}
          disabled={isLoading || !canAcceptMore}
          className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : canAcceptMore ? "Accept" : "Quota Full"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRejectClick} 
          disabled={isLoading}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          {isLoading ? "..." : "Reject"}
        </Button>
      </div>
      <ConfirmDialog />
    </>
  )
}
