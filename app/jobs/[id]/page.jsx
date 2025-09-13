import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Navbar from "@/components/navbar"
import { JobDetailClient } from "@/components/job-detail-client"

export default async function JobDetailsPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get job details
  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      *,
      job_categories(name, icon, color),
      profiles!jobs_employer_id_fkey(full_name, rating, phone, location)
    `)
    .eq("id", id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Check if user already applied
  const { data: existingApplication } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", id)
    .eq("worker_id", user.id)
    .single()

  // Get applications with status breakdown
  const { data: allApplications } = await supabase
    .from("job_applications")
    .select("id, status")
    .eq("job_id", id)

  const applicationsCount = allApplications?.length || 0
  const acceptedCount = allApplications?.filter(app => app.status === "accepted").length || 0
  const workersNeeded = job.workers_needed || 1
  const isFullyStaffed = acceptedCount >= workersNeeded

  const isEmployer = job.employer_id === user.id
  const hasApplied = !!existingApplication
  const canApply = !isEmployer && !hasApplied && job.status === "open" && !isFullyStaffed

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <JobDetailClient 
        job={job}
        user={user}
        existingApplication={existingApplication}
        allApplications={allApplications}
        applicationsCount={applicationsCount}
        acceptedCount={acceptedCount}
        workersNeeded={workersNeeded}
        isFullyStaffed={isFullyStaffed}
        isEmployer={isEmployer}
        hasApplied={hasApplied}
        canApply={canApply}
      />
    </div>
  )
}
