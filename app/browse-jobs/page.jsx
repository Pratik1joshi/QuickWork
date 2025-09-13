"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState("list")
  const [isLoading, setIsLoading] = useState(true)

  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryParam = searchParams.get('category')

  useEffect(() => {
    // Set initial category from URL params
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
    fetchCategories()
  }, [categoryParam])

  useEffect(() => {
    fetchJobs()
  }, [selectedCategory, sortBy])

  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
    // Update URL
    if (value === "all") {
      router.push('/browse-jobs')
    } else {
      router.push(`/browse-jobs?category=${value}`)
    }
  }

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("job_categories").select("*").order("name")
    if (data) {
      // Add "Others" category
      const othersCategory = { id: 'others', name: 'Others', icon: '📋' }
      setCategories([...data, othersCategory])
    }
  }

  const fetchJobs = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      let query = supabase
        .from("jobs")
        .select(`
          *,
          job_categories(name, icon, color),
          profiles!jobs_employer_id_fkey(full_name, rating)
        `)
        // Remove status filter to show all jobs for debugging
        // .eq("status", "open")

      if (selectedCategory !== "all") {
        if (selectedCategory === "others") {
          query = query.is("category_id", null)
        } else {
          query = query.eq("category_id", selectedCategory)
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "budget_high":
          query = query.order("budget_max", { ascending: false })
          break
        case "budget_low":
          query = query.order("budget_min", { ascending: true })
          break
        case "urgent":
          query = query.order("urgency", { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching jobs:', error)
        setJobs([])
      } else {
        console.log('Fetched jobs:', data)
        setJobs(data || [])
      }
    } catch (error) {
      console.error('Error in fetchJobs:', error)
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="budget_high">Highest Budget</SelectItem>
                <SelectItem value="budget_low">Lowest Budget</SelectItem>
                <SelectItem value="urgent">Most Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredJobs.length} jobs found
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          /* List View */
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or create a new job</p>
                <div className="mt-4">
                  <Link href="/post-job">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      Post a Job
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          {job.urgency !== "normal" && (
                            <Badge className={getUrgencyColor(job.urgency)}>{job.urgency}</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>💰</span>
                            <span>
                              Rs. {job.budget_min} - {job.budget_max}
                            </span>
                          </div>
                          {job.estimated_duration && (
                            <div className="flex items-center space-x-1">
                              <span>⏱️</span>
                              <span>{job.estimated_duration}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>Posted by {job.profiles?.full_name}</span>
                            {job.profiles?.rating && job.profiles.rating > 0 && (
                              <span className="flex items-center space-x-1">
                                <span>⭐</span>
                                <span>{job.profiles.rating.toFixed(1)}</span>
                              </span>
                            )}
                            <span>•</span>
                            <span>{formatTimeAgo(job.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 text-center">
                        <div className="text-3xl mb-2">{job.job_categories?.icon || '📋'}</div>
                        <Badge variant="outline" className="text-xs mb-3">
                          {job.job_categories?.name || 'Others'}
                        </Badge>
                        <div>
                          <Link href={`/jobs/${job.id}`}>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                              Apply Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Map View */
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              Interactive map with job locations will be available in the next update
            </p>
            <Button variant="outline" onClick={() => setViewMode("list")}>
              Switch to List View
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
