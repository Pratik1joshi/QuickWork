"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Phone, MessageCircle } from "lucide-react"
import { ApplyJobForm } from "@/components/apply-job-form"
import { CollapsibleChat } from "@/components/collapsible-chat"

export function JobDetailClient({ 
  job, 
  user, 
  existingApplication, 
  allApplications,
  applicationsCount,
  acceptedCount,
  workersNeeded,
  isFullyStaffed,
  isEmployer,
  hasApplied,
  canApply 
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Status Banner for Fulfilled Jobs */}
        {isFullyStaffed && (
          <div className="lg:col-span-3 mb-6">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg text-center font-semibold text-lg shadow-lg">
              🎉 POSITION FILLED - All {workersNeeded} worker{workersNeeded !== 1 ? 's' : ''} have been hired for this job!
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    {job.urgency !== "normal" && (
                      <Badge className={getUrgencyColor(job.urgency)}>{job.urgency}</Badge>
                    )}
                    {/* Job Status Badges */}
                    {isFullyStaffed ? (
                      <Badge className="bg-green-600 text-white animate-pulse">
                        ✅ COMPLETE
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white">
                        🔍 {workersNeeded - acceptedCount} spot{(workersNeeded - acceptedCount) !== 1 ? 's' : ''} left
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Posted {formatDate(job.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">{job.job_categories?.icon}</div>
                  <Badge variant="outline">{job.job_categories?.name}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
              </CardContent>
            </Card>
          )}

          {/* Application Form */}
          {canApply && (
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Job</CardTitle>
              </CardHeader>
              <CardContent>
                <ApplyJobForm jobId={job.id} />
              </CardContent>
            </Card>
          )}

          {!isEmployer && !hasApplied && isFullyStaffed && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Position Filled</h3>
                <p className="text-gray-600">
                  This job has hired all {workersNeeded} required workers and is no longer accepting applications.
                </p>
              </CardContent>
            </Card>
          )}

          {hasApplied && (
            <>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Application Submitted</h3>
                  <p className="text-gray-600">
                    You have already applied for this job. The employer will contact you if selected.
                  </p>
                </CardContent>
              </Card>

              {/* Collapsible Chat with Employer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CollapsibleChat 
                    applicationId={existingApplication.id} 
                    currentUserId={user.id}
                    applicantName="Employer"
                  />
                </CardContent>
              </Card>
            </>
          )}

          {isEmployer && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">This is Your Job</h3>
                <p className="text-gray-600 mb-4">
                  You posted this job. You can manage applications and update the job status.
                </p>
                <Link href={`/jobs/${job.id}/manage`}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">Manage Job</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Budget</h4>
                <p className="text-2xl font-bold text-green-600">
                  Rs. {job.budget_min} - {job.budget_max}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Workers Needed</h4>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-blue-600">
                    {acceptedCount} / {workersNeeded} hired
                  </p>
                  {isFullyStaffed ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white">
                        ✅ Position Filled
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500 text-white">
                        🔍 {workersNeeded - acceptedCount} spot{(workersNeeded - acceptedCount) !== 1 ? 's' : ''} remaining
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {job.estimated_duration && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                  <p className="text-gray-700">{job.estimated_duration}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                <Badge variant={job.status === "open" ? "default" : "secondary"}>{job.status}</Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Applications</h4>
                <p className="text-gray-700">{applicationsCount || 0} received</p>
              </div>
            </CardContent>
          </Card>

          {/* Employer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {job.profiles?.full_name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{job.profiles?.full_name}</h4>
                  {job.profiles?.rating && job.profiles.rating > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <span>⭐</span>
                      <span>{job.profiles.rating.toFixed(1)} rating</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Contact Preference</h5>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {job.contact_preference === "phone" && (
                    <>
                      <Phone className="w-4 h-4" />
                      <span>Phone calls preferred</span>
                    </>
                  )}
                  {job.contact_preference === "app" && (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>App messages only</span>
                    </>
                  )}
                  {job.contact_preference === "both" && (
                    <>
                      <Phone className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                      <span>Phone or app</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
