"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Phone, RefreshCw } from "lucide-react"
import { ApplicationActions } from "@/components/application-actions"
import { CollapsibleChat } from "@/components/collapsible-chat"
import { createClient } from "@/lib/supabase/client"

export function JobApplicationsManager({ 
  initialApplications, 
  job, 
  user 
}) {
  const [applications, setApplications] = useState(initialApplications)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const workersNeeded = job.workers_needed || 1
  
  // Format date function inside the component
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Function to refresh applications from database
  const refreshApplications = async () => {
    console.log("[JobApplicationsManager] Refreshing applications for job:", job.id)
    setIsRefreshing(true)
    try {
      const supabase = createClient()
      const { data: freshApplications, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          profiles!job_applications_worker_id_fkey(full_name, rating, phone)
        `)
        .eq("job_id", job.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[JobApplicationsManager] Error refreshing applications:", error)
      } else {
        console.log("[JobApplicationsManager] Fresh applications loaded:", freshApplications)
        console.log("[JobApplicationsManager] Applications by status:", {
          pending: freshApplications?.filter(app => app.status === "pending").length || 0,
          accepted: freshApplications?.filter(app => app.status === "accepted").length || 0,
          rejected: freshApplications?.filter(app => app.status === "rejected").length || 0
        })
        setApplications(freshApplications || [])
      }
    } catch (error) {
      console.error("[JobApplicationsManager] Failed to refresh applications:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh when component mounts to get latest data
  useEffect(() => {
    refreshApplications()
  }, [job.id])
  
  // Separate applications by status
  const pendingApplications = applications.filter(app => app.status === "pending")
  const acceptedApplications = applications.filter(app => app.status === "accepted")
  const rejectedApplications = applications.filter(app => app.status === "rejected")
  
  const acceptedCount = acceptedApplications.length
  const isJobFulfilled = acceptedCount >= workersNeeded
  const spotsRemaining = workersNeeded - acceptedCount

  const handleStatusChange = useCallback(async (applicationId, newStatus) => {
    // First update the local state for immediate UI feedback
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus }
          : app
      )
    )
    
    // Then refresh from database to ensure we have the latest data
    setTimeout(() => {
      refreshApplications()
    }, 1000)
  }, [])

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

  const getStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "✅ Accepted"
      case "rejected":
        return "❌ Rejected"
      default:
        return status
    }
  }

  const ApplicationCard = ({ application, showActions = false, status }) => (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      application.status === 'accepted' 
        ? 'border-green-300 bg-green-50 shadow-md' 
        : application.status === 'rejected'
        ? 'border-red-200 bg-red-50'
        : 'border-gray-200 bg-white hover:shadow-sm'
    }`} key={application.id}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            application.status === 'accepted' 
              ? 'bg-green-500 text-white' 
              : application.status === 'rejected'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="text-sm font-medium">
              {application.status === 'accepted' 
                ? '✓' 
                : application.status === 'rejected'
                ? '✗'
                : application.profiles?.full_name?.charAt(0) || "U"
              }
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{application.profiles?.full_name}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {application.profiles?.rating && application.profiles.rating > 0 && (
                <span className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{application.profiles.rating.toFixed(1)}</span>
                </span>
              )}
              <span>Applied {formatDate(application.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(application.status)}>
            {getStatusText(application.status)}
          </Badge>
          {application.status === 'accepted' && (
            <Badge className="bg-green-600 text-white animate-pulse">🎊 HIRED</Badge>
          )}
        </div>
      </div>

      {application.message && (
        <div className="mb-3">
          <h5 className="font-medium text-gray-900 mb-1">Cover Message</h5>
          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{application.message}</p>
        </div>
      )}

      {application.proposed_rate && (
        <div className="mb-3">
          <h5 className="font-medium text-gray-900 mb-1">Proposed Rate</h5>
          <p className="text-green-600 font-semibold">Rs. {application.proposed_rate}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {application.profiles?.phone && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{application.profiles.phone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {showActions ? (
            <ApplicationActions
              applicationId={application.id}
              jobId={job.id}
              workerId={application.worker_id}
              workersNeeded={workersNeeded}
              acceptedCount={acceptedCount}
              applicantName={application.profiles?.full_name || "this applicant"}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="text-sm font-medium px-3 py-1 rounded-full">
              {status === "accepted" && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  ✅ Accepted
                </span>
              )}
              {status === "rejected" && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                  ❌ Rejected
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <CollapsibleChat applicationId={application.id} currentUserId={user.id} />
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Job Status Banner */}
      {isJobFulfilled ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">🎉 Job Position Fulfilled!</h3>
              <p className="text-green-600">
                All {workersNeeded} worker{workersNeeded !== 1 ? 's' : ''} have been hired. This job is now closed to new applications.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{spotsRemaining}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">🔍 Hiring in Progress</h3>
              <p className="text-blue-600">
                Looking for {spotsRemaining} more worker{spotsRemaining !== 1 ? 's' : ''}. {acceptedCount} already hired.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
        <Button 
          onClick={refreshApplications} 
          disabled={isRefreshing}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Hired Workers Section */}
      <Card className={`border-2 ${isJobFulfilled ? 'border-green-300 bg-green-50' : 'border-green-200'}`}>
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center gap-3">
            <span>🎉 Hired Workers ({acceptedApplications.length} / {workersNeeded})</span>
            {isJobFulfilled && (
              <Badge className="bg-green-600 text-white animate-pulse">🏆 COMPLETE</Badge>
            )}
            {!isJobFulfilled && acceptedApplications.length > 0 && (
              <Badge className="bg-yellow-500 text-white">{spotsRemaining} more needed</Badge>
            )}
          </CardTitle>
          {acceptedApplications.length > 0 && (
            <p className="text-green-600 text-sm">
              {isJobFulfilled 
                ? "🎊 Congratulations! All positions are filled. These workers are ready to start." 
                : "These workers have been accepted for your job and can start working."
              }
            </p>
          )}
        </CardHeader>
        <CardContent>
          {acceptedApplications.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">No workers hired yet</h3>
              <p className="text-green-600">Accept applications below to hire workers for this job.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedApplications.map((application) => (
                <ApplicationCard 
                  key={`accepted-${application.id}`}
                  application={application} 
                  showActions={false}
                  status="accepted"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Applications Section */}
      <Card className={isJobFulfilled ? 'border-gray-300 bg-gray-50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className={isJobFulfilled ? 'text-gray-600' : ''}>
              ⏳ Pending Applications ({pendingApplications.length})
            </span>
            {isJobFulfilled ? (
              <Badge className="bg-gray-600 text-white">🔒 POSITION FILLED</Badge>
            ) : (
              acceptedCount >= workersNeeded && (
                <Badge className="bg-red-600 text-white">Quota Full</Badge>
              )
            )}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className={isJobFulfilled ? 'text-gray-500' : 'text-gray-600'}>
              🎯 Target: {workersNeeded} worker{workersNeeded !== 1 ? 's' : ''}
            </span>
            <span className="text-green-600 font-semibold">✅ Hired: {acceptedCount}</span>
            <span className={isJobFulfilled ? 'text-gray-500' : 'text-blue-600'}>
              ⏳ Pending: {pendingApplications.length}
            </span>
            {isJobFulfilled && (
              <span className="text-gray-600 font-semibold">🎉 JOB COMPLETE!</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isJobFulfilled && pendingApplications.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📢</span>
                <div>
                  <h4 className="font-semibold text-yellow-800">Position Filled Notice</h4>
                  <p className="text-yellow-700 text-sm">
                    All required positions have been filled. These pending applications will be automatically declined.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {pendingApplications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
              <p className="text-gray-600">All applications have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <ApplicationCard 
                  key={`pending-${application.id}`}
                  application={application} 
                  showActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected Applications Section */}
      {rejectedApplications.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">🗂️ Rejected Applications ({rejectedApplications.length})</CardTitle>
            <p className="text-red-500 text-sm">
              These applications were not selected for this job.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejectedApplications.map((application) => (
                <ApplicationCard 
                  key={`rejected-${application.id}`}
                  application={application} 
                  showActions={false}
                  status="rejected"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
