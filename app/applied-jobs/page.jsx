import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"

export default async function AppliedJobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Jobs I've Applied To</h1>
          <p className="text-gray-600">Track the status of your job applications</p>
        </div>

        {!appliedJobs || appliedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-4">Browse available jobs and start applying to find work.</p>
              <Link href="/browse-jobs">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">Browse Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appliedJobs.map((application) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
