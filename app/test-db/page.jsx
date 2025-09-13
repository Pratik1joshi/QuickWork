"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function TestDatabase() {
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [jobs, setJobs] = useState([])

  const testColumn = async () => {
    setIsLoading(true)
    setStatus("Testing workers_needed column...")

    try {
      const supabase = createClient()

      // First, try to fetch existing jobs with workers_needed
      const { data: existingJobs, error: fetchError } = await supabase
        .from("jobs")
        .select("id, title, workers_needed")
        .limit(5)

      if (fetchError) {
        setStatus(`❌ Error fetching jobs: ${fetchError.message}`)
        return
      }

      if (existingJobs.length > 0) {
        const hasColumn = existingJobs[0].hasOwnProperty('workers_needed')
        if (hasColumn) {
          setStatus("✅ workers_needed column exists!")
          setJobs(existingJobs)
        } else {
          setStatus("⚠️ workers_needed column missing - will use default value of 1")
        }
      } else {
        setStatus("⚠️ No jobs found to test with")
      }

    } catch (error) {
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testApplications = async () => {
    setIsLoading(true)
    setStatus("Testing accept/reject functionality...")

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setStatus("❌ Please log in first")
        return
      }

      // Test basic functionality
      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("*")
        .limit(1)

      if (appError) {
        setStatus(`❌ Error accessing applications: ${appError.message}`)
        return
      }

      setStatus("✅ Basic database access working!")

    } catch (error) {
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testColumn()
  }, [])

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Database Test & Debug</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={testColumn} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Test workers_needed Column"}
        </Button>
        
        <Button onClick={testApplications} disabled={isLoading} className="w-full" variant="outline">
          {isLoading ? "Testing..." : "Test Applications Functionality"}
        </Button>
      </div>

      {status && (
        <div className="p-4 bg-gray-100 rounded text-sm mb-4">
          <strong>Status:</strong> {status}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2">Sample Jobs:</h3>
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="p-3 bg-gray-50 rounded text-sm">
                <strong>{job.title}</strong> - Workers needed: {job.workers_needed || "undefined"}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded">
        <h4 className="font-bold mb-2">Manual Database Setup (if needed):</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to <strong>Supabase Dashboard</strong></li>
          <li>Navigate to <strong>Table Editor → jobs table</strong></li>
          <li>Click <strong>"Add Column"</strong></li>
          <li>Name: <code>workers_needed</code></li>
          <li>Type: <code>int4</code> (integer)</li>
          <li>Default: <code>1</code></li>
          <li>✅ Is nullable: <strong>false</strong></li>
          <li>Click <strong>Save</strong></li>
        </ol>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-bold mb-2">Quick Links:</h4>
        <div className="space-y-1">
          <a href="/dashboard" className="text-blue-600 hover:underline block">→ Dashboard</a>
          <a href="/my-jobs" className="text-blue-600 hover:underline block">→ My Jobs</a>
          <a href="/post-job" className="text-blue-600 hover:underline block">→ Post Job</a>
        </div>
      </div>
    </div>
  )
}
