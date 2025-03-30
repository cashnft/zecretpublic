import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="w-full px-6 py-4 flex justify-between items-center bg-dark-900/80 backdrop-blur-sm sticky top-0 z-10">
      <Link href="/">
        <div className="flex items-center space-x-2 cursor-pointer">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8L19 15C19 17.2091 17.2091 19 15 19L9 19C6.79086 19 5 17.2091 5 15L5 8" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
              <rect x="7" y="4" width="10" height="6" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
              <path d="M12 12L12 16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.div>
          <h1 className="text-xl font-bold tracking-tighter">
            <span className="text-primary-500">Z</span>ecret
          </h1>
        </div>
      </Link>
      
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            {user && (
              <div className="hidden md:flex items-center mr-2 text-dark-300">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>{user.display_name || 'Anonymous'}</span>
              </div>
            )}
            <Link href="/chat">
              <button className="btn btn-outline py-1.5 px-3">
                <svg className="w-5 h-5 mr-1 inline-block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 10.5H16M8 14.5H13M16 18H18C19.1046 18 20 17.1046 20 16V8.5C20 7.39543 19.1046 6.5 18 6.5H6C4.89543 6.5 4 7.39543 4 8.5V16C4 17.1046 4.89543 18 6 18H8V21.5L12 18H16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">Chat</span>
              </button>
            </Link>
            <button 
              onClick={logout} 
              className="text-dark-300 hover:text-white"
              aria-label="Log out"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17L21 12M21 12L16 7M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <Link href="/login">
              <button className="btn btn-outline">Log In</button>
            </Link>
            <Link href="/register">
              <button className="btn btn-primary">Register</button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}