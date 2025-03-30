import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatContainer({ activeConversation, messages, currentUserId, sendMessage, loading }) {
  const [showInfo, setShowInfo] = useState(false);
  
  // If no active conversation, show empty state
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-dark-800 flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10.5H16M8 14.5H13M16 18H18C19.1046 18 20 17.1046 20 16V8.5C20 7.39543 19.1046 6.5 18 6.5H6C4.89543 6.5 4 7.39543 4 8.5V16C4 17.1046 4.89543 18 6 18H8V21.5L12 18H16Z" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Select a conversation</h2>
        <p className="text-dark-400 max-w-md">
          Choose someone from the online users list to start a secure, encrypted chat.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative mr-3">
            <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center text-lg font-medium">
              {(activeConversation.name || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-dark-900 rounded-full"></span>
          </div>
          <div>
            <h2 className="font-medium">{activeConversation.name || 'Anonymous'}</h2>
            <div className="flex items-center text-xs text-dark-400">
              <span className="mr-1">Encrypted</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 8V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-dark-400 hover:text-white"
          aria-label="Conversation Info"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8H12.01M12 11V16M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      {/* Info Panel (conditionally rendered) */}
      {showInfo && (
        <div className="p-4 border-b border-dark-800 bg-dark-800/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Conversation Info</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-dark-400 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          <div className="text-sm text-dark-300 space-y-2">
            <p className="flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-primary-500">
                <path d="M16 8V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              End-to-end encrypted conversation
            </p>
            <p className="flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-primary-500">
                <path d="M15.5 3.5V2M15.5 22V20.5M3.5 15.5H2M22 15.5H20.5M5.04 5.04L4 4M19.96 19.96L18.92 18.92M5.04 19.96L4 20.96M19.96 5.04L18.92 4.04M10 3.5H20.5V10M20.5 15.5V10M10 20.5H3.5V10M3.5 10V3.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Perfect forward secrecy enabled
            </p>
            <p className="flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-primary-500">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Message integrity verification
            </p>
          </div>
        </div>
      )}
      
      {/* Messages - Fixed height container */}
      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <MessageList 
          messages={messages} 
          currentUserId={currentUserId}
          loading={loading}
        />
      </div>
      
      {/* Message Input */}
      <div className="mt-auto">
        <MessageInput onSendMessage={sendMessage} disabled={loading} />
      </div>
    </div>
  );
}