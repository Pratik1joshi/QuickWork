import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import Navbar from "@/components/navbar"

export default async function PaymentSuccessPage({ params }) {
  const { jobId } = await params
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
      profiles!jobs_worker_id_fkey(full_name)
    `)
    .eq("id", jobId)
    .single()

  if (error || !job) {
    notFound()
  }

  // Only employer can see payment success
  if (job.employer_id !== user.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully. The funds will be released to the worker once the job is
              completed.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Job</span>
                <span className="font-medium">{job.title}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Worker</span>
                <span className="font-medium">{job.profiles?.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Amount</span>
                <span className="font-bold text-green-600">Rs. {job.budget_max}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href={`/jobs/${jobId}`} className="block">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                View Job Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <p className="font-medium mb-1">What happens next?</p>
            <p>
              The worker will complete the job and mark it as finished. You can then release the payment and leave a
              review.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
