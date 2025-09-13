"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, MessageCircle } from "lucide-react"

export function Chat({ applicationId, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    fetchConversation()
  }, [applicationId])

  useEffect(() => {
    if (conversation) {
      fetchMessages()
      
      // Temporary polling solution since Supabase real-time is in early access
      console.log('Setting up polling for real-time updates (Supabase early access workaround)')
      const pollInterval = setInterval(() => {
        fetchMessages()
      }, 5000) // Poll every 5 seconds

      // Keep the real-time subscription for when it becomes available
      const testChannel = supabase
        .channel('test-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('🔥 ANY real-time event on messages table:', payload)
            console.log('Event type:', payload.eventType)
            console.log('New data:', payload.new)
            console.log('Old data:', payload.old)
          }
        )
        .subscribe((status, err) => {
          console.log('🧪 Test subscription status:', status, 'Error:', err)
        })

      const specificChannel = supabase
        .channel(`messages-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('📨 Specific real-time event received:', payload)
            if (payload.new && payload.new.conversation_id === conversation.id) {
              console.log('✅ Message matches our conversation, adding to state')
              setMessages(prev => {
                const exists = prev.some(msg => msg.id === payload.new.id)
                if (exists) {
                  console.log('⏭️ Message already exists, skipping')
                  return prev
                }
                console.log('➕ Adding new message to state')
                return [...prev, {
                  ...payload.new,
                  profiles: payload.new.profiles || { full_name: 'Unknown' }
                }]
              })
            } else {
              console.log('❌ Message does not match our conversation:', payload.new?.conversation_id, 'vs', conversation.id)
            }
          }
        )
        .subscribe((status, err) => {
          console.log('🎯 Specific subscription status:', status, 'Error:', err)
          if (status === 'SUBSCRIBED') {
            console.log('🎉 Successfully subscribed to conversation updates!')
          }
        })

      return () => {
        console.log('🧹 Cleaning up subscriptions and polling')
        clearInterval(pollInterval)
        supabase.removeChannel(testChannel)
        supabase.removeChannel(specificChannel)
      }
    }
  }, [conversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      console.log('Fetching conversation for applicationId:', applicationId)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('application_id', applicationId)

      if (error) {
        console.error('Error fetching conversation:', JSON.stringify(error, null, 2))
        console.error('Error details:', error.message, error.details, error.hint)
        // If table doesn't exist or other error, don't crash
        setLoading(false)
        return
      }

      console.log('Conversation data:', data)

      if (data && data.length > 0) {
        setConversation(data[0])
      } else {
        // Conversation doesn't exist yet, try to create it
        console.log('No conversation found, trying to create one')
        await createConversation()
      }
    } catch (err) {
      console.error('Unexpected error fetching conversation:', err)
      setLoading(false)
    }
    setLoading(false)
  }

  const createConversation = async () => {
    try {
      console.log('Creating conversation for applicationId:', applicationId)
      const { data, error } = await supabase
        .from('conversations')
        .insert({ application_id: applicationId })
        .select()

      if (error) {
        console.error('Error creating conversation:', error)
        return
      }

      console.log('Created conversation:', data)

      if (data && data.length > 0) {
        setConversation(data[0])
      }
    } catch (err) {
      console.error('Unexpected error creating conversation:', err)
    }
  }

  const fetchMessages = async () => {
    if (!conversation) return

    console.log('Fetching messages for conversation:', conversation.id)

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey(full_name)
      `)
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      console.error('Error details:', error.message, error.details, error.hint)
      return
    }

    console.log('Fetched messages:', data)
    setMessages(data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation) return

    const messageContent = newMessage.trim()
    console.log('Sending message:', messageContent, 'to conversation:', conversation.id)

    // Optimistically add message to local state
    const tempMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: messageContent,
      created_at: new Date().toISOString(),
      profiles: { full_name: 'You' } // Temporary display
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage("")

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: messageContent
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        // Remove the optimistic message and show error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        setNewMessage(messageContent) // Restore the message
        return
      }

      console.log('Message sent successfully:', data)
      // Replace temp message with real one
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? { ...data, profiles: { full_name: 'You' } } : msg
      ))
    } catch (err) {
      console.error('Unexpected error sending message:', err)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      setNewMessage(messageContent)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <MessageCircle className="w-5 h-5 animate-spin" />
            <span className="ml-2">Loading chat...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!conversation) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-500 text-center">Chat not available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.sender_id === currentUserId
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === currentUserId ? 'text-orange-100' : 'text-gray-500'
                  }`}>
                    {message.profiles?.full_name || 'You'} • {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()} className="bg-orange-500 hover:bg-orange-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
