'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string) => {
  if (!text) return text;
  
  // Convert markdown to HTML
  let formattedText = text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text: *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks: ```code``` -> <code>code</code>
    .replace(/```([\s\S]*?)```/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Inline code: `code` -> <code>code</code>
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    // Line breaks: \n -> <br>
    .replace(/\n/g, '<br>')
    // Lists: - item -> <li>item</li>
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Numbered lists: 1. item -> <li>item</li>
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  
  // Wrap lists in <ul> tags
  if (formattedText.includes('<li>')) {
    formattedText = formattedText.replace(/(<li>.*<\/li>)/g, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
  }
  
  return formattedText;
};

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  extractedText: string
  isEnabled: boolean
}

export default function ChatPanel({ extractedText, isEnabled }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim() || !isEnabled) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/ask-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue.trim(),
          extracted_text: extractedText
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.answer,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Show success toast
        import('@/utils/toast').then(({ toast }) => {
          toast.success('Question answered successfully!')
        })
      } else {
        throw new Error(data.message || 'Failed to get answer')
      }
    } catch (error) {
      console.error('Error asking question:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Show error toast
      import('@/utils/toast').then(({ toast }) => {
        toast.error(error instanceof Error ? error.message : 'Failed to get answer. Please try again.')
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isEnabled) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            Upload and process a document to start asking questions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card h-full flex flex-col">
                       {/* Header */}
                 <div className="flex items-center space-x-3 mb-6">
                   <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                     <Bot className="h-6 w-6 text-blue-600" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-slate-800">Ask Questions</h2>
                     <p className="text-sm text-slate-500">Get AI-powered insights about your document</p>
                   </div>
                 </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                           {messages.length === 0 ? (
                     <div className="text-center py-8">
                       <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                         <Bot className="h-6 w-6 text-blue-600" />
                       </div>
                       <p className="text-slate-600 text-sm font-medium">
                         Ask me anything about your document!
                       </p>
                     </div>
                   ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex space-x-3',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
                                       {message.type === 'assistant' && (
                           <div className="flex-shrink-0">
                             <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                               <Bot className="h-4 w-4 text-blue-600" />
                             </div>
                           </div>
                         )}
              
                                       <div
                           className={cn(
                             'max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm',
                             message.type === 'user'
                               ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                               : 'bg-white border border-slate-200 text-slate-800'
                           )}
                         >
                <div 
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: message.type === 'assistant' 
                      ? renderMarkdown(message.content) 
                      : message.content 
                  }}
                />
                <p className={cn(
                  'text-xs mt-1',
                  message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                )}>
                  {formatTime(message.timestamp)}
                </p>
              </div>

                                       {message.type === 'user' && (
                           <div className="flex-shrink-0">
                             <div className="w-8 h-8 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full flex items-center justify-center">
                               <User className="h-4 w-4 text-slate-600" />
                             </div>
                           </div>
                         )}
            </div>
          ))
        )}
        
                           {isLoading && (
                     <div className="flex space-x-3">
                       <div className="flex-shrink-0">
                         <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                           <Bot className="h-4 w-4 text-blue-600" />
                         </div>
                       </div>
                       <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
                         <div className="flex items-center space-x-2">
                           <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                           <span className="text-sm text-slate-600 font-medium">Thinking...</span>
                         </div>
                       </div>
                     </div>
                   )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your document..."
          className="input-field flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={cn(
            'btn-primary px-4 py-2',
            (!inputValue.trim() || isLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

                       {/* Help Text */}
                 <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                   <p className="text-xs text-slate-600 font-medium">
                     💡 Examples: "What is the main topic?", "Summarize the key points", "What are the important dates?"
                   </p>
                 </div>
    </div>
  )
}
