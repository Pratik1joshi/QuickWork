import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Smartphone, Building } from "lucide-react"
import { PaymentForm } from "@/components/payment-form"
import Navbar from "@/components/navbar"

export default async function PaymentPage({ params }) {
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
      profiles!jobs_employer_id_fkey(full_name),
      profiles!jobs_worker_id_fkey(full_name)
    `)
    .eq("id", jobId)
    .single()

  if (error || !job) {
    notFound()
  }

  // Only employer or assigned worker can access payment
  const canAccess = job.employer_id === user.id || job.worker_id === user.id
  if (!canAccess) {
    redirect("/dashboard")
  }

  const isEmployer = job.employer_id === user.id
  const finalAmount = job.budget_max // Using max budget as final amount for demo

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-6 h-6" />
                  <span>{isEmployer ? "Pay for Job" : "Receive Payment"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEmployer ? (
                  <div>
                    <p className="text-gray-600 mb-6">
                      Complete the payment to release funds to the worker upon job completion.
                    </p>
                    <PaymentForm jobId={jobId} amount={finalAmount} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💰</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Pending</h3>
                    <p className="text-gray-600 mb-4">
                      The employer will release payment once the job is marked as completed.
                    </p>
                    <Badge className="bg-yellow-100 text-yellow-800">Awaiting Payment Release</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Available Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    <Smartphone className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">eSewa</h4>
                      <p className="text-sm text-gray-600">Digital wallet</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    <Smartphone className="w-8 h-8 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Khalti</h4>
                      <p className="text-sm text-gray-600">Digital wallet</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    <Building className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Bank Transfer</h4>
                      <p className="text-sm text-gray-600">Direct transfer</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{job.job_categories?.icon}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.job_categories?.name}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employer</span>
                    <span className="font-medium">{job.profiles?.full_name}</span>
                  </div>

                  {job.worker_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Worker</span>
                      <span className="font-medium">{job.profiles?.full_name}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">{job.location}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge variant="outline">{job.status.replace("_", " ")}</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600">Rs. {finalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-sm">🛡️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Secure Payment</h4>
                    <p className="text-sm text-gray-600">
                      Your payment is held securely until the job is completed and both parties are satisfied.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
