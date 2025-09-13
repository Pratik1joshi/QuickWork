"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/supabase/auth-hook"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SignUpSuccessPage() {
  const { user, loading, error } = useAuth()
  const [profileCreated, setProfileCreated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const createProfile = async () => {
      if (user && !profileCreated) {
        try {
          const supabase = createClient()
          
          // Create user profile in profiles table
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              full_name: user.user_metadata?.full_name || "User",
              phone: user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (profileError) {
            console.error("Error creating profile:", profileError)
          } else {
            console.log("Profile created successfully")
            setProfileCreated(true)
          }
        } catch (error) {
          console.error("Error creating profile:", error)
        }
      }
    }

    createProfile()
  }, [user, profileCreated])

  // Redirect to login if no user after loading
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [loading, user, router])

  const handleContinue = () => {
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Setting up your account...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Account Created Successfully!</CardTitle>
          <CardDescription className="text-gray-600">
            Welcome to QuickWork! Your account has been set up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Email Verification</span>
              </div>
              <p className="text-sm text-blue-700">
                We've sent a verification email to <strong>{user.email}</strong>. 
                Please check your inbox and click the verification link to complete your account setup.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">What's next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Complete your profile</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Browse available jobs</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Start applying for work</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
