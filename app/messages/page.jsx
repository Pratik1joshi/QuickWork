"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"

export default function MessagesPage() {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

    if (diffInHours < 1) {
      return "now"
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.other_participant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="h-[calc(100vh-64px)] bg-white flex">
      {/* Sidebar - Conversations List */}
      <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-gray-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="lg:hidden">
                ←
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 rounded-full"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-sm text-center mb-4">
                Apply to jobs to start chatting with employers!
              </p>
              <Link href="/browse-jobs">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Find Jobs
                </Button>
              </Link>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.other_participant.profile_image_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                      {conversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {conversation.other_participant.full_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 font-medium truncate mb-1">
                    💼 {conversation.job_title}
                  </p>
                  {conversation.last_message && (
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message.sender_id === user.id ? "You: " : ""}
                      {conversation.last_message.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedConversation ? 'hidden lg:flex' : 'flex'} flex-col flex-1`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
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
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                    {selectedConversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedConversation.other_participant.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    💼 {selectedConversation.job_title}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === user.id
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedConversation.other_participant.profile_image_url} />
                          <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                            {selectedConversation.other_participant.full_name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isOwn && !showAvatar && <div className="w-8" />}
                      
                      <div className={`group max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        </div>
                        <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="rounded-full border-gray-300"
                    disabled={sendingMessage}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 rounded-full w-10 h-10 p-0"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    "➤"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-white">💬</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to Messages
              </h2>
              <p className="text-gray-600 mb-6">
                Select a conversation from the sidebar to start chatting with employers and job seekers.
              </p>
              <div className="space-y-3">
                <Link href="/browse-jobs">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    🔍 Find Jobs to Apply
                  </Button>
                </Link>
                <Link href="/post-job">
                  <Button variant="outline" className="w-full">
                    💼 Post a Job
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
