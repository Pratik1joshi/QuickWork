import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus } from "lucide-react"
import { Chat } from "@/components/chat"
import { DeleteJobButton } from "@/components/delete-job-button"
import Navbar from "@/components/navbar"

export default async function MyJobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get jobs posted by user
  const { data: postedJobs } = await supabase
    .from("jobs")
    .select(`
      *,
      job_categories(name, icon, color),
      job_applications(id, status)
    `)
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false })

  // Get jobs applied to by user
  const { data: appliedJobs } = await supabase
    .from("job_applications")
    .select(`
      *,
      jobs(
        *,
        job_categories(name, icon, color),
        profiles!jobs_employer_id_fkey(full_name)
      )
    `)
    .eq("worker_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="posted" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posted">Jobs I Posted ({postedJobs?.length || 0})</TabsTrigger>
            <TabsTrigger value="applied">Jobs I Applied To ({appliedJobs?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="posted" className="space-y-4">
            {!postedJobs || postedJobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-600 mb-4">Start by posting your first job to find skilled workers.</p>
                  <Link href="/post-job">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">Post Your First Job</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              postedJobs.map((job) => {
                const totalApplications = job.job_applications?.length || 0
                const acceptedApplications = job.job_applications?.filter(app => app.status === "accepted") || []
                const hasAcceptedApplications = acceptedApplications.length > 0

                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <Badge className={getStatusColor(job.status)}>{job.status.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📍 {job.location}</span>
                            <span>
                              💰 Rs. {job.budget_min} - {job.budget_max}
                            </span>
                            <span>📅 {formatDate(job.created_at)}</span>
                            <span>📝 {totalApplications} applications</span>
                            {hasAcceptedApplications && (
                              <span className="text-green-600 font-semibold">✅ {acceptedApplications.length} hired</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-center">
                          <div className="text-3xl mb-2">{job.job_categories?.icon}</div>
                          <div className="space-y-2">
                            <Link href={`/jobs/${job.id}`}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                            <Link href={`/jobs/${job.id}/manage`}>
                              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                                Manage
                              </Button>
                            </Link>
                            <DeleteJobButton 
                              jobId={job.id}
                              jobTitle={job.title}
                              applicationCount={totalApplications}
                              hasAcceptedApplications={hasAcceptedApplications}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-4">
            {!appliedJobs || appliedJobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-600 mb-4">Browse available jobs and start applying to find work.</p>
                  <Link href="/browse-jobs">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">Browse Jobs</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              appliedJobs.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{application.jobs?.title}</h3>
                          <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{application.jobs?.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📍 {application.jobs?.location}</span>
                          <span>
                            💰 Rs. {application.jobs?.budget_min} - {application.jobs?.budget_max}
                          </span>
                          <span>👤 {application.jobs?.profiles?.full_name}</span>
                          <span>📅 Applied {formatDate(application.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-center">
                        <div className="text-3xl mb-2">{application.jobs?.job_categories?.icon}</div>
                        <Link href={`/jobs/${application.jobs?.id}`}>
                          <Button size="sm" variant="outline">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Chat applicationId={application.id} currentUserId={user.id} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
