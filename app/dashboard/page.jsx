import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"

export default async function DashboardPage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get selected category from URL params
  const params = await searchParams
  const selectedCategory = params?.category

  // Get recent jobs - filter by category if selected
  let jobsQuery = supabase
    .from("jobs")
    .select(`
      *,
      job_categories(name, icon, color),
      profiles!jobs_employer_id_fkey(full_name),
      job_applications(status)
    `)
    .order("created_at", { ascending: false })
    .limit(12)

  if (selectedCategory && selectedCategory !== 'others') {
    jobsQuery = jobsQuery.eq("category_id", selectedCategory)
  } else if (selectedCategory === 'others') {
    jobsQuery = jobsQuery.is("category_id", null)
  }

  const { data: recentJobs } = await jobsQuery

  // Helper function to calculate job status
  const getJobStatus = (job) => {
    const workersNeeded = job.workers_needed || 1
    const acceptedApplications = job.job_applications?.filter(app => app.status === 'accepted') || []
    const acceptedCount = acceptedApplications.length
    const isFullyStaffed = acceptedCount >= workersNeeded
    const spotsRemaining = workersNeeded - acceptedCount

    return {
      workersNeeded,
      acceptedCount,
      isFullyStaffed,
      spotsRemaining,
      totalApplications: job.job_applications?.length || 0
    }
  }

  // Get job categories for quick actions
  const { data: categories } = await supabase.from("job_categories").select("*").limit(8)

  // Add "Others" category if not already present
  const categoriesWithOthers = categories ? [
    ...categories,
    { id: 'others', name: 'Others', icon: '📋', color: '#95A5A6' }
  ] : []

  // Get user's posted jobs
  const { data: postedJobs } = await supabase
    .from("jobs")
    .select("*", { count: 'exact' })
    .eq("employer_id", user.id)

  // Get user's job applications
  const { data: appliedJobs } = await supabase
    .from("job_applications")
    .select("*", { count: 'exact' })
    .eq("worker_id", user.id)

  // Get user's conversations count
  const { data: userConversations } = await supabase
    .from("conversations")
    .select(`
      id,
      job_applications!inner(
        worker_id,
        jobs!inner(employer_id)
      )
    `)

  // Filter conversations where user is involved
  const conversationsCount = userConversations?.filter(conv => {
    const application = conv.job_applications
    const job = application.jobs
    return application.worker_id === user.id || job.employer_id === user.id
  }).length || 0

  // Get job stats for dashboard
  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: 'exact', head: true })

  const { count: activeJobs } = await supabase
    .from("jobs")
    .select("*", { count: 'exact', head: true })
    .eq("status", "open")

  const { count: companiesCount } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 mb-10 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-32 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-16 translate-y-8"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="text-white mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Welcome back, <br />
                  <span className="text-yellow-300">{profile?.full_name || 'Friend'}!</span>
                </h1>
                <p className="text-blue-100 text-xl mb-6 max-w-lg">
                  Discover amazing opportunities or find the perfect talent for your projects in Nepal.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/post-job">
                    <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      🚀 Post a Job
                    </Button>
                  </Link>
                  <Link href="/browse-jobs">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full font-semibold">
                      🔍 Browse Jobs
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 text-center lg:text-left">
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-yellow-300">{postedJobs?.length || 0}</div>
                  <div className="text-blue-100 text-sm">Your Jobs</div>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-green-300">{appliedJobs?.length || 0}</div>
                  <div className="text-blue-100 text-sm">Applied Jobs</div>
                </div>
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-pink-300">{totalJobs || 0}</div>
                  <div className="text-blue-100 text-sm">Total Platform Jobs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Dashboard Quick Actions */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link href="/my-jobs">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">💼</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Your Jobs</h3>
                  <p className="text-blue-600 font-semibold text-2xl">{postedJobs?.length || 0}</p>
                  <p className="text-gray-600 text-sm">Jobs Posted</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/applied-jobs">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">📋</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Applied Jobs</h3>
                  <p className="text-green-600 font-semibold text-2xl">{appliedJobs?.length || 0}</p>
                  <p className="text-gray-600 text-sm">Applications Sent</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/messages">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">💬</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Messages</h3>
                  <p className="text-pink-600 font-semibold text-2xl">{conversationsCount}</p>
                  <p className="text-gray-600 text-sm">Conversations</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">👤</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Edit Profile</h3>
                  <p className="text-purple-600 font-semibold text-lg">
                    {profile?.rating?.toFixed(1) || "0.0"} ⭐
                  </p>
                  <p className="text-gray-600 text-sm">Your Rating</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payment/history">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">💳</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Payments</h3>
                  <p className="text-orange-600 font-semibold text-lg">History</p>
                  <p className="text-gray-600 text-sm">View Transactions</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quick Category Navigation */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Explore by Category</h2>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-1 bg-gray-300 rounded-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {categoriesWithOthers?.map((category, index) => (
              <Link key={category.id} href={`/dashboard?category=${category.id}`}>
                <div className={`group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                  selectedCategory === category.id 
                    ? 'ring-4 ring-blue-500 shadow-2xl' 
                    : 'hover:shadow-xl'
                }`}>
                  <div 
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                    style={{ backgroundColor: category.color || '#6366f1' }}
                  ></div>
                  
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6 text-center relative">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    </CardContent>
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Jobs Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {selectedCategory ? 
                  `${categoriesWithOthers?.find(cat => cat.id === selectedCategory)?.name || 'Other'} Jobs` : 
                  'Latest Opportunities'
                }
              </h2>
              <p className="text-gray-600">Find your next career move or perfect hire</p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedCategory && (
                <Link href="/dashboard">
                  <Button variant="outline" className="rounded-full px-6 hover:bg-gray-50 border-gray-300">
                    ✕ Clear Filter
                  </Button>
                </Link>
              )}
              <Link href="/browse-jobs">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6 shadow-lg">
                  View All Jobs →
                </Button>
              </Link>
            </div>
          </div>

          {recentJobs?.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl">💼</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No jobs posted yet</h3>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Be the pioneer! Post the first job and connect with amazing talent in Nepal.
              </p>
              <Link href="/post-job">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  🚀 Post Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {recentJobs?.map((job, index) => {
                const jobStatus = getJobStatus(job)
                return (
                  <Card key={job.id} className={`group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden hover:-translate-y-1 ${
                    jobStatus.isFullyStaffed ? 'ring-2 ring-green-300' : ''
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Status Banner */}
                    {jobStatus.isFullyStaffed && (
                      <div className="bg-green-500 text-white px-4 py-2 text-center font-semibold">
                        🎉 POSITION FILLED - All {jobStatus.workersNeeded} worker{jobStatus.workersNeeded !== 1 ? 's' : ''} hired!
                      </div>
                    )}
                    
                    <CardContent className="p-8 relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 pr-6">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            {job.urgency !== "normal" && (
                              <Badge 
                                variant={job.urgency === "urgent" ? "destructive" : "secondary"}
                                className={`px-3 py-1 rounded-full font-semibold ${
                                  job.urgency === "urgent" 
                                    ? "bg-red-500 text-white animate-pulse" 
                                    : "bg-yellow-500 text-black"
                                }`}
                              >
                                {job.urgency === "urgent" ? "🔥 URGENT" : "⚡ HIGH PRIORITY"}
                              </Badge>
                            )}
                            {/* Job Status Badge */}
                            {jobStatus.isFullyStaffed ? (
                              <Badge className="bg-green-600 text-white animate-pulse">
                                ✅ COMPLETE
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500 text-white">
                                🔍 {jobStatus.spotsRemaining} spot{jobStatus.spotsRemaining !== 1 ? 's' : ''} left
                              </Badge>
                            )}
                          </div>
                        
                        <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                          {job.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-6 text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            <span className="font-medium">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💰</span>
                            <span className="font-bold text-green-600">
                              Rs. {job.budget_min?.toLocaleString()} - {job.budget_max?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">�</span>
                            <span className="font-medium text-blue-600">
                              {job.workers_needed || 1} worker{(job.workers_needed || 1) > 1 ? 's' : ''} needed
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">�👤</span>
                            <span>Posted by <strong>{job.profiles?.full_name}</strong></span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <span className="text-3xl">{job.job_categories?.icon || '📋'}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-sm font-medium border-gray-300 text-gray-700 bg-white/80"
                          style={{ borderColor: job.job_categories?.color || '#6366f1' }}
                        >
                          {job.job_categories?.name || 'Others'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Application Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            {jobStatus.acceptedCount}/{jobStatus.workersNeeded} workers hired
                          </span>
                          {jobStatus.totalApplications > 0 && (
                            <span>
                              {jobStatus.totalApplications} application{jobStatus.totalApplications !== 1 ? 's' : ''} received
                            </span>
                          )}
                        </div>
                        {!jobStatus.isFullyStaffed && (
                          <span className="text-blue-600 font-medium">
                            Still hiring
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Posted {new Date(job.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                          View Details →
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Call to Action Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-indigo-100">Join thousands of professionals and companies in Nepal</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/post-job">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-50 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                I'm Hiring
              </Button>
            </Link>
            <Link href="/browse-jobs">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full font-bold">
                I'm Looking for Work
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}