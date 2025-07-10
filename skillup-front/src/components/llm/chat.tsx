'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LLMService, ChatMessage } from '@/lib/services/llm.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ChatProps {
  className?: string;
  placeholder?: string;
  maxHeight?: string;
  showHeader?: boolean;
}

export function Chat({ 
  className = '', 
  placeholder = 'Ask CourseBot anything...',
  maxHeight = '500px',
  showHeader = true 
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check service availability on mount
  useEffect(() => {
    checkServiceAvailability();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkServiceAvailability = async () => {
    try {
      const available = await LLMService.isAvailable();
      setIsServiceAvailable(available);
    } catch (error) {
      console.error('Error checking service availability:', error);
      setIsServiceAvailable(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Send message to LLM service
      const response = await LLMService.chat(userMessage, messages);
      
      if (response.success && response.reply) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.reply
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'Failed to get response from CourseBot');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      // Focus back to input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const retryLastMessage = async () => {
    if (messages.length === 0) return;
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (!lastUserMessage) return;

    // Remove the last assistant message if it exists and there was an error
    const newMessages = messages.filter((msg, index) => {
      if (index === messages.length - 1 && msg.role === 'assistant') {
        return false;
      }
      return true;
    });
    
    setMessages(newMessages);
    setError(null);
    setIsLoading(true);

    try {
      const response = await LLMService.chat(lastUserMessage.content, newMessages.slice(0, -1));
      
      if (response.success && response.reply) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.reply
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(response.error || 'Failed to get response from CourseBot');
      }
    } catch (error) {
      console.error('Retry error:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`flex flex-col ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">CourseBot</h3>
            <div className={`w-2 h-2 rounded-full ${
              isServiceAvailable === null ? 'bg-gray-400' :
              isServiceAvailable ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500">
              {isServiceAvailable === null ? 'Checking...' :
               isServiceAvailable ? 'Online' : 'Offline'}
            </span>
          </div>
          {messages.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChat}
              className="text-xs"
            >
              Clear Chat
            </Button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/50 to-white scrollbar-thin"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to CourseBot!</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              I'm here to help you with course creation, learning strategies,<br />
              and answer any questions about your educational journey.
            </p>
            <div className="mt-4 text-xs text-gray-500">
              Try asking: "How do I create an effective course outline?"
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-3'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600'
                  }`}>
                    {message.role === 'user' ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3.5V7.5L17 8.5V18H7V8.5L9 7.5V3.5L3 7V9H1V11H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V11H23V9H21Z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.486 2 2 6.486 2 12c0 1.674.395 3.251 1.09 4.652L2 22l5.348-1.09C8.749 21.605 10.326 22 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2z"/>
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Message Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex max-w-[85%]">
              {/* Bot Avatar */}
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.486 2 2 6.486 2 12c0 1.674.395 3.251 1.09 4.652L2 22l5.348-1.09C8.749 21.605 10.326 22 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2z"/>
                  </svg>
                </div>
              </div>
              
              {/* Loading Bubble */}
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-600">CourseBot is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 max-w-[90%]">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm flex-1">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryLastMessage}
                className="text-xs bg-white hover:bg-red-50 border-red-300 text-red-700"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isServiceAvailable === false ? 'CourseBot is offline' : placeholder}
              disabled={isLoading || isServiceAvailable === false}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-2xl px-4 py-3 text-sm resize-none"
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading || isServiceAvailable === false}
            className="rounded-2xl px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>
        
        {isServiceAvailable === false && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">CourseBot is currently unavailable.</span>
              <button 
                type="button"
                onClick={checkServiceAvailability}
                className="text-sm underline hover:no-underline font-medium"
              >
                Retry connection
              </button>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}

export default Chat;
