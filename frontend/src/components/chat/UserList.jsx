import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import UserItem from './UserItem';
import { useChat } from '../../hooks/useChat';

export default function UserList({ users, loading, activeUserId, onSelectUser, isMobile = false, onClose }) {
  const { unreadMessages } = useChat();
  
  
  
  // Animation variants for the list items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-full w-72 bg-dark-900 border-r border-dark-800'}`}>
      <div className="p-4 border-b border-dark-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Online Users</h2>
          <p className="text-sm text-dark-400">{users?.length || 0} available</p>
        </div>
        
        {isMobile && onClose && (
          <button 
            onClick={onClose}
            className="text-dark-300 hover:text-white"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-dark-500">
              <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 21C3 16.0294 7.02944 12 12 12C16.9706 12 21 16.0294 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>No users online right now</p>
            <p className="text-sm mt-2">Wait for someone to connect</p>
          </div>
        ) : (
          <motion.div 
            className="space-y-1"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {users.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                isActive={activeUserId === user.id}
                onClick={onSelectUser}
                unreadCount={unreadMessages[user.id] || 0}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}