"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Chat } from "@/components/chat"
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react"

export function CollapsibleChat({ applicationId, currentUserId, applicantName = "Applicant" }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-t border-gray-100 pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Chat with {applicantName}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>
      
      {isOpen && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <Chat applicationId={applicationId} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}
