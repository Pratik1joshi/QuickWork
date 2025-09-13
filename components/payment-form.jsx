"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Smartphone, Building, CreditCard } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function PaymentForm({ jobId, amount }) {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [formData, setFormData] = useState({
    phone: "",
    accountNumber: "",
    pin: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Simulate payment processing
      console.log("[v0] Processing payment:", {
        jobId,
        amount,
        method: paymentMethod,
        ...formData,
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // For demo purposes, always succeed
      console.log("[v0] Payment processed successfully")

      // Redirect to success page
      router.push(`/payment/${jobId}/success`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "esewa":
      case "khalti":
        return <Smartphone className="w-5 h-5" />
      case "bank":
        return <Building className="w-5 h-5" />
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Payment Method *</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="esewa">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>eSewa</span>
              </div>
            </SelectItem>
            <SelectItem value="khalti">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>Khalti</span>
              </div>
            </SelectItem>
            <SelectItem value="bank">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-green-600" />
                <span>Bank Transfer</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Details */}
      {paymentMethod && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              {getPaymentMethodIcon(paymentMethod)}
              <h4 className="font-medium text-gray-900">
                {paymentMethod === "esewa" && "eSewa Payment"}
                {paymentMethod === "khalti" && "Khalti Payment"}
                {paymentMethod === "bank" && "Bank Transfer"}
              </h4>
            </div>

            <div className="space-y-4">
              {(paymentMethod === "esewa" || paymentMethod === "khalti") && (
                <>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+977 98XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pin" className="text-sm font-medium text-gray-700">
                      {paymentMethod === "esewa" ? "eSewa PIN" : "Khalti PIN"} *
                    </Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter your PIN"
                      value={formData.pin}
                      onChange={(e) => handleInputChange("pin", e.target.value)}
                      className="mt-1"
                      maxLength={4}
                      required
                    />
                  </div>
                </>
              )}

              {paymentMethod === "bank" && (
                <div>
                  <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">
                    Account Number *
                  </Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Enter your account number"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amount Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">Job Amount</span>
          <span className="font-medium">Rs. {amount}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">Service Fee (5%)</span>
          <span className="font-medium">Rs. {Math.round(amount * 0.05)}</span>
        </div>
        <div className="border-t border-blue-200 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-blue-600">Rs. {amount + Math.round(amount * 0.05)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        disabled={!paymentMethod || isLoading}
      >
        {isLoading ? "Processing Payment..." : `Pay Rs. ${amount + Math.round(amount * 0.05)}`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        This is a demo payment system. No actual money will be charged.
      </p>
    </form>
  )
}
