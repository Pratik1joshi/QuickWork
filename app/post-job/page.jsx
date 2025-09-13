"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"

export default function PostJobPage() {
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    budget_min: "",
    budget_max: "",
    location: "",
    urgency: "normal",
    estimated_duration: "",
    requirements: "",
    contact_preference: "app",
    workers_needed: "1",
  })
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("job_categories").select("*").order("name")

      if (data) {
        // Add "Others" category at the end
        const othersCategory = { id: 'others', name: 'Others', icon: '📋' }
        setCategories([...data, othersCategory])
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Please log in to post a job")

      // Create job
      const jobData = {
        ...formData,
        employer_id: user.id,
        category_id: formData.category_id === 'others' ? null : formData.category_id,
        budget_min: Number.parseFloat(formData.budget_min),
        budget_max: Number.parseFloat(formData.budget_max),
      }

      // Only add workers_needed if it's provided
      if (formData.workers_needed) {
        jobData.workers_needed = Number.parseInt(formData.workers_needed)
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert(jobData)
        .select()
        .single()

      if (error) throw error

      console.log("[v0] Job created successfully:", data)
      router.push(`/jobs/${data.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to post job")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Post a New Job</CardTitle>
            <CardDescription>Fill out the details below to find the right worker for your task</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Job Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., House cleaning needed"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Category *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Job Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what needs to be done..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-1"
                  rows={4}
                  required
                />
              </div>

              {/* Budget & Workers Needed */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="budget_min" className="text-sm font-medium text-gray-700">
                    Min Budget (Rs.) *
                  </Label>
                  <Input
                    id="budget_min"
                    type="number"
                    placeholder="500"
                    value={formData.budget_min}
                    onChange={(e) => handleInputChange("budget_min", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="budget_max" className="text-sm font-medium text-gray-700">
                    Max Budget (Rs.) *
                  </Label>
                  <Input
                    id="budget_max"
                    type="number"
                    placeholder="1500"
                    value={formData.budget_max}
                    onChange={(e) => handleInputChange("budget_max", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="workers_needed" className="text-sm font-medium text-gray-700">
                    Workers Needed *
                  </Label>
                  <Input
                    id="workers_needed"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="1"
                    value={formData.workers_needed}
                    onChange={(e) => handleInputChange("workers_needed", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Thamel, Kathmandu"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {/* Urgency & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimated_duration" className="text-sm font-medium text-gray-700">
                    Estimated Duration
                  </Label>
                  <Input
                    id="estimated_duration"
                    placeholder="e.g., 2-3 hours"
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange("estimated_duration", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <Label htmlFor="requirements" className="text-sm font-medium text-gray-700">
                  Special Requirements
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="Any special tools, skills, or requirements..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Contact Preference */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Contact Preference</Label>
                <Select
                  value={formData.contact_preference}
                  onValueChange={(value) => handleInputChange("contact_preference", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">Through App Only</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="both">Both App & Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Posting..." : "Post Job"}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
