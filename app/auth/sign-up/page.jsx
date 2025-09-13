"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [activeTab, setActiveTab] = useState("email")
  const router = useRouter()

  const handleGoogleSignUp = async () => {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `https://quick-work-mu.vercel.app/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        console.error("Google OAuth error:", error)
        if (error.message.includes("OAuth provider not configured")) {
          alert("Google sign-up is not configured. Please contact support or use email signup.")
          return
        }
        throw error
      }
    } catch (error) {
      console.error("Google signup error:", error)
      alert("Failed to sign up with Google. Please try email signup.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">QW</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Join QuickWork</CardTitle>
          <CardDescription className="text-gray-600">Create your account to start finding work</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <EmailSignUp />
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              <PhoneSignUp />
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Continue with Google</h3>
                  <p className="text-gray-600 mb-4">We'll collect your phone number after signup</p>
                  <Button
                    onClick={handleGoogleSignUp}
                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/auth/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmailSignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `https://quick-work-mu.vercel.app/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        console.log("Sign up successful:", data.user)
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        throw new Error("Failed to create user")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setError(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          placeholder="+977 98XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
          required
          minLength={6}
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">Account created successfully! Redirecting...</p>}

      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
}

function PhoneSignUp() {
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState("phone") // "phone" or "otp"
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // For demo purposes, we'll simulate OTP
      // In production, you'd integrate with SMS service
      console.log("Sending OTP to:", phone)
      
      // Simulate OTP sent
      setStep("otp")
    } catch (error) {
      console.error("OTP send error:", error)
      setError("Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // For demo, accept any OTP
      if (otp.length < 4) {
        throw new Error("Invalid OTP")
      }

      // Create account with phone
      const tempEmail = `${phone.replace(/\D/g, '')}@phone.quickwork.local`
      
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: Math.random().toString(36), // Random password
        options: {
          emailRedirectTo: `https://quick-work-mu.vercel.app/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        console.log("Phone sign up successful:", data.user)
        router.push("/dashboard")
      } else {
        throw new Error("Failed to create user")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError(error instanceof Error ? error.message : "Failed to verify OTP")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleSendOTP} className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
            placeholder="+977 98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Sending OTP..." : "Send OTP"}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          We sent an OTP to {phone}
        </p>
      </div>
      <div>
        <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
          Enter OTP
        </Label>
        <Input
          id="otp"
          type="text"
          placeholder="1234"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mt-1 text-center text-2xl tracking-widest"
          maxLength={6}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="space-y-2">
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setStep("phone")}
        >
          Change Phone Number
        </Button>
      </div>
    </form>
  )
}
