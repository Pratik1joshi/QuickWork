"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ChatSystem({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const supabase = createClient()

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return

    try {
      // First, get conversations where user is involved
      const { data: conversationsData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          job_applications!inner(
            id,
            job_id,
            worker_id,
            jobs!inner(
              id,
              title,
              employer_id
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (convError) {
        console.error("Conversations query error:", convError)
        return
      }

      // Filter conversations where user is either worker or employer
      const userConversations = conversationsData.filter(conv => {
        const application = conv.job_applications
        const job = application.jobs
        return application.worker_id === user.id || job.employer_id === user.id
      })

      // Get profiles for other participants
      const otherUserIds = userConversations.map(conv => {
        const application = conv.job_applications
        const job = application.jobs
        const isEmployer = job.employer_id === user.id
        return isEmployer ? application.worker_id : job.employer_id
      }).filter(Boolean)

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image_url")
        .in("id", otherUserIds)

      // Get messages for each conversation
      const conversationIds = userConversations.map(conv => conv.id)
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })

      // Process conversations to add other participant info and last message
      const processedConversations = userConversations.map(conv => {
        const application = conv.job_applications
        const job = application.jobs
        const isEmployer = job.employer_id === user.id
        const otherUserId = isEmployer ? application.worker_id : job.employer_id
        
        const otherParticipant = profiles?.find(p => p.id === otherUserId) || {
          full_name: isEmployer ? "Job Seeker" : "Employer",
          profile_image_url: null
        }
        
        // Get last message for this conversation
        const conversationMessages = messagesData?.filter(msg => msg.conversation_id === conv.id) || []
        const lastMessage = conversationMessages[0] // Already ordered by created_at desc

        return {
          ...conv,
          job_title: job.title,
          other_participant: otherParticipant,
          last_message: lastMessage,
          is_employer: isEmployer
        }
      })

      setConversations(processedConversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            full_name,
            profile_image_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage("")
      fetchMessages(selectedConversation.id)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return

    const messageSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            fetchMessages(selectedConversation.id)
          }
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [user, selectedConversation])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <span className="text-xl">💬</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 h-96 p-0 bg-white border border-gray-200 shadow-lg" 
        align="end" 
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Chat Header */}
          <div className="border-b p-4 bg-white">
            <h3 className="font-semibold text-lg">Messages</h3>
          </div>

          {/* Chat Content */}
          <div className="flex flex-col flex-1 min-h-0">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="border-b p-3 flex items-center space-x-3 bg-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="p-1"
                  >
                    ←
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedConversation.other_participant.profile_image_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {selectedConversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedConversation.other_participant.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Job: {selectedConversation.job_title}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-2 ${
                          message.sender_id === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-3 bg-white">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
                      size="sm"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Conversations List */
              <div className="flex-1 overflow-y-auto bg-white">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white">
                    <span className="text-3xl mb-2">💬</span>
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Apply to jobs to start chatting!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors bg-white"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.other_participant.profile_image_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {conversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {conversation.other_participant.full_name}
                            </p>
                            {conversation.last_message && (
                              <p className="text-xs text-gray-500">
                                {formatTime(conversation.last_message.created_at)}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.job_title}
                          </p>
                          {conversation.last_message && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
