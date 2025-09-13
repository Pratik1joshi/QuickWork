"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function ApplyJobForm({ jobId }) {
  const [message, setMessage] = useState("")
  const [proposedRate, setProposedRate] = useState("")
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Please log in to apply")

      // Create application
      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        worker_id: user.id,
        message: message.trim() || null,
        proposed_rate: proposedRate ? Number.parseFloat(proposedRate) : null,
      })

      if (error) throw error

      console.log("[v0] Application submitted successfully")
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to submit application")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
          Cover Message (Optional)
        </Label>
        <Textarea
          id="message"
          placeholder="Tell the employer why you're the right person for this job..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="proposed_rate" className="text-sm font-medium text-gray-700">
          Your Proposed Rate (Rs.) - Optional
        </Label>
        <Input
          id="proposed_rate"
          type="number"
          placeholder="Enter your rate if different from budget"
          value={proposedRate}
          onChange={(e) => setProposedRate(e.target.value)}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">💬</span>
          <p className="text-sm text-blue-800">
            <strong>What happens next?</strong> A conversation will be automatically created for you to chat with the employer once you apply!
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  )
}
