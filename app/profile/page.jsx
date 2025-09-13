"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Camera, User, MapPin, Phone, Mail, Star, CheckCircle, Upload } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/navbar"

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      setProfile(profileData || {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        phone: '',
        location: '',
        profile_image_url: null,
        rating: 0,
        total_jobs_completed: 0,
        is_verified: false
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (file) => {
    if (!file) return

    setUploadingImage(true)
    setError(null)

    try {
      // Create form data for API upload
      const formData = new FormData()
      formData.append('file', file)

      // Upload via our API route
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Upload API error:', errorData)

        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid file')
        } else if (response.status === 401) {
          throw new Error('Please log in to upload images')
        } else {
          throw new Error(errorData.error || 'Upload failed')
        }
      }

      const data = await response.json()
      console.log('Upload successful:', data)

      // Update profile with new image URL
      setProfile(prev => ({ ...prev, profile_image_url: data.imageUrl }))

    } catch (error) {
      console.error("Error uploading image:", error)
      setError(error.message || "Failed to upload image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file")
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      handleImageUpload(file)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          profile_image_url: profile.profile_image_url,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving profile:", error)
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    {profile?.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0">
                      {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                        <div
                          className="bg-gray-400 text-white p-2 rounded-full cursor-not-allowed"
                          title="Cloudinary not configured - check CLOUDINARY_SETUP.md"
                        >
                          <Camera className="w-4 h-4" />
                        </div>
                      ) : (
                        <>
                          <label
                            htmlFor="profile-image-upload"
                            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors cursor-pointer block"
                            title="Upload profile image"
                          >
                            {uploadingImage ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </label>
                          <input
                            id="profile-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {profile?.full_name || "Your Name"}
                  </h2>

                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {profile?.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {profile?.rating?.toFixed(1) || "0.0"} ({profile?.total_jobs_completed || 0} jobs)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{user?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center justify-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center justify-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your personal information and profile settings
                  {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <strong>Image Upload:</strong> To enable profile image uploads, follow the setup guide in <code>CLOUDINARY_SETUP.md</code>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={profile?.full_name || ""}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile?.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="mt-1"
                        placeholder="+977 98XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      Location
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      value={profile?.location || ""}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="mt-1"
                      placeholder="e.g., Kathmandu, Nepal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      className="mt-1"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed from profile settings
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-600">Profile updated successfully!</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Link href="/dashboard">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
