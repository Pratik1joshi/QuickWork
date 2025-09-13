"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          job_applications!inner(
            *,
            jobs!inner(
              title,
              employer_id
            ),
            worker:profiles!job_applications_worker_id_fkey(
              full_name,
              profile_image_url
            )
          ),
          messages(
            content,
            created_at,
            sender_id
          )
        `)
        .or(`job_applications.worker_id.eq.${user.id},job_applications.jobs.employer_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Process conversations to add other participant info
      const processedConversations = data.map(conv => {
        const application = conv.job_applications
        const job = application.jobs
        const isEmployer = job.employer_id === user.id
        const otherParticipant = isEmployer ? application.worker : null
        
        // Get last message
        const lastMessage = conv.messages.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0]

        return {
          ...conv,
          job_title: job.title,
          other_participant: otherParticipant || {
            full_name: isEmployer ? application.worker.full_name : "Employer",
            profile_image_url: isEmployer ? application.worker.profile_image_url : null
          },
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

    setSendingMessage(true)
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
      setSendingMessage(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
            <Card className="h-full">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                      <span className="text-4xl mb-4">💬</span>
                      <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                      <p className="text-sm text-center mb-4">
                        Apply to jobs to start chatting with employers or post jobs to receive applications!
                      </p>
                      <div className="space-x-2">
                        <Link href="/browse-jobs">
                          <Button size="sm">Find Jobs</Button>
                        </Link>
                        <Link href="/post-job">
                          <Button variant="outline" size="sm">Post Job</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.other_participant.profile_image_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {conversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {conversation.other_participant.full_name}
                              </p>
                              {conversation.last_message && (
                                <p className="text-xs text-gray-500">
                                  {formatTime(conversation.last_message.created_at)}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-blue-600 truncate font-medium">
                              {conversation.job_title}
                            </p>
                            {conversation.last_message && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {conversation.last_message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className={`lg:col-span-2 ${!selectedConversation ? 'hidden lg:block' : ''}`}>
            <Card className="h-full">
              {selectedConversation ? (
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      ←
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.other_participant.profile_image_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedConversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {selectedConversation.other_participant.full_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Job: {selectedConversation.job_title}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end space-x-2 max-w-[70%]">
                          {message.sender_id !== user.id && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedConversation.other_participant.profile_image_url} />
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {selectedConversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`rounded-lg p-3 ${
                              message.sender_id === user.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-3">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                      >
                        {sendingMessage ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <span className="text-4xl mb-4 block">💬</span>
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-sm">Choose a conversation from the list to start chatting</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
