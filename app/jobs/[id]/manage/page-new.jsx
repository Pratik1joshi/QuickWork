import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { JobStatusManager } from "@/components/job-status-manager"
import { JobApplicationsManager } from "@/components/job-applications-manager"
import { ToastProvider } from "@/components/toast"
import Navbar from "@/components/navbar"

export default async function ManageJobPage({ params }) {
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
      job_categories(name, icon, color)
    `)
    .eq("id", id)
    .eq("employer_id", user.id) // Only allow employer to manage
    .single()

  if (error || !job) {
    notFound()
  }

  // Get applications
  const { data: applications } = await supabase
    .from("job_applications")
    .select(`
      *,
      profiles!job_applications_worker_id_fkey(full_name, rating, phone)
    `)
    .eq("job_id", id)
    .order("created_at", { ascending: false })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Manage Job Applications</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Job Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">{job.job_categories?.icon || "💼"}</span>
                    <span>{job.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                    <Badge style={{ backgroundColor: job.job_categories?.color }}>
                      {job.job_categories?.name}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                    <JobStatusManager jobId={job.id} initialStatus={job.status} />
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                    <p className="text-gray-700">{job.location}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Budget</h4>
                    <p className="text-green-600 font-semibold">Rs. {job.budget}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Workers Needed</h4>
                    <p className="text-blue-600 font-semibold">{job.workers_needed || 1}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Requirements</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements?.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Posted</h4>
                    <p className="text-gray-700">{formatDate(job.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Applications */}
            <div className="lg:col-span-2 space-y-6">
              <JobApplicationsManager 
                initialApplications={applications || []}
                job={job}
                user={user}
                formatDate={formatDate}
              />
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
