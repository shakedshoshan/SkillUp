'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Chat } from '@/components/llm/chat';
import Image from 'next/image';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={toggleChat}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-white"
          size="lg"
        >
          <div className="relative">
            {isOpen ? (
              // Close icon
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Enhanced chat icon
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
                />
              </svg>
            )}
            
            {/* Notification dot */}
            {!isOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            )}
          </div>
        </Button>
        
        {/* Enhanced Tooltip */}
        {!isOpen && (
          <div className="absolute right-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
              Chat with CourseBot
              <div className="absolute left-full top-1/2 transform -translate-y-1/2">
                <div className="border-8 border-transparent border-l-gray-900"></div>
              </div>
            </div>
          </div>
        )}
        

      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40">
          {/* Chat Container */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[500px] transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-2 zoom-in-95">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                 
                  <Image src="/icons/person.png" width={40} height={40} alt="CourseBot" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">CourseBot</h3>
                  <p className="text-xs text-blue-100">AI Learning Assistant</p>
                </div>
              </div>
              <Button
                onClick={closeChat}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20 h-9 w-9 p-0 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            
            {/* Chat Component */}
            <div className="h-[calc(100%-5rem)]">
              <Chat 
                className="h-full border-0 rounded-none rounded-b-2xl"
                showHeader={false}
                maxHeight="none"
                placeholder="Ask me anything about learning..."
              />
            </div>
          </div>
          
          {/* Click outside to close overlay */}
          <div 
            className="fixed inset-0 -z-10"
            onClick={closeChat}
          />
        </div>
      )}
    </>
  );
}

export default ChatButton; 