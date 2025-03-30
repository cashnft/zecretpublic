import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import MessageItem from './MessageItem';
import { useChat } from '../../hooks/useChat';

export default function MessageList({ messages, currentUserId, loading }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Access the chat context directly
  const { 
    loadMoreMessages, 
    isLoadingMoreMessages,
    hasMoreMessages,
    activeConversation
  } = useChat();
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle scroll to detect when to load more
  const handleScroll = () => {
    if (!messagesContainerRef.current || !activeConversation) return;
    
    // If user scrolled near the top (50px from top), load more messages
    if (messagesContainerRef.current.scrollTop < 50 && !isLoadingMoreMessages) {
      if (hasMoreMessages(activeConversation.id)) {
        loadMoreMessages(activeConversation.id);
      }
    }
  };
  
  // Handle loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Handle empty message list
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10H16M8 14H13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        <h3 className="text-xl font-bold mb-2">No messages yet</h3>
        <p className="text-dark-400 max-w-sm">
          Send your first message to start a secure, end-to-end encrypted conversation.
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4" 
      onScroll={handleScroll}
      ref={messagesContainerRef}
    >
      {/* Loading indicator for more messages */}
      {isLoadingMoreMessages && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Load more button (alternative to scroll detection) */}
      {activeConversation && hasMoreMessages(activeConversation.id) && !isLoadingMoreMessages && (
        <div className="text-center py-2">
          <button 
            onClick={() => loadMoreMessages(activeConversation.id)}
            className="text-primary-400 text-sm hover:underline"
          >
            Load earlier messages
          </button>
        </div>
      )}
      
      {/* Message items */}
      {messages.map((message, index) => (
        <MessageItem
          key={message.id || `msg-${index}`}
          message={message}
          isOwn={message.senderId === currentUserId}
          showDay={index === 0 || !isSameDay(message.timestamp, messages[index-1].timestamp)}
        />
      ))}
      
      {/* Invisible element for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
}

// Helper function to check if two dates are on the same day
function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}