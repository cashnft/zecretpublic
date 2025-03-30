import React from 'react';
import { motion } from 'framer-motion';

export default function MessageItem({ message, isOwn, showDay }) {
  // Format date for day display
  const formatDay = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric'
      });
    }
  };
  
  return (
    <>
      {showDay && (
        <div className="flex justify-center my-6">
          <div className="bg-dark-800 text-dark-400 text-xs px-3 py-1 rounded-full">
            {formatDay(message.timestamp)}
          </div>
        </div>
      )}
      
      <motion.div 
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className={`max-w-xs md:max-w-md rounded-2xl p-3 ${
            isOwn
              ? 'bg-primary-600 text-white rounded-tr-none'
              : 'bg-dark-800 rounded-tl-none'
          } ${message.error ? 'opacity-50' : ''} ${message.pending ? 'opacity-80' : ''}`}
        >
          {message.error && (
            <div className="text-red-400 text-xs mb-1 flex items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Error sending
            </div>
          )}
          
          {message.pending && (
            <div className="text-dark-300 text-xs mb-1 flex items-center">
              <div className="w-2 h-2 mr-1 rounded-full bg-dark-300 animate-pulse"></div>
              Sending...
            </div>
          )}
          
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          
          <div className={`text-xs mt-1 flex justify-end ${isOwn ? 'text-primary-200' : 'text-dark-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Helper function to check if two dates are on the same day
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}