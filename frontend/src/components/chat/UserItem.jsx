import React from 'react';
import { motion } from 'framer-motion';

export default function UserItem({ 
  user, 
  isActive, 
  onClick, 
  unreadCount = 0 // Add unread count prop with default 0
}) {
  return (
    <motion.button
      className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
        isActive 
          ? 'bg-primary-900/30 text-white' 
          : 'hover:bg-dark-800 text-dark-300'
      }`}
      onClick={() => onClick(user.id, user.display_name)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-lg font-medium">
          {(user.display_name || 'A').charAt(0).toUpperCase()}
        </div>
        
        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-900 rounded-full"></span>
        
        {/* Unread message indicator */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
      <div>
        <p className="font-medium">{user.display_name || 'Anonymous'}</p>
        <p className="text-xs">Online</p>
      </div>
    </motion.button>
  );
}