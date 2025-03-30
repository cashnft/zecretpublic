import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-dark-800 bg-dark-950">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 8L19 15C19 17.2091 17.2091 19 15 19L9 19C6.79086 19 5 17.2091 5 15L5 8" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
            <rect x="7" y="4" width="10" height="6" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
            <path d="M12 12L12 16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-lg font-bold">
            <span className="text-primary-500">Z</span>ecret
          </span>
        </div>
        
        <div className="text-center md:text-right">
          <p className="text-sm text-dark-400">
            &copy; {new Date().getFullYear()} Zecret. All rights reserved.
          </p>
          <p className="text-xs text-dark-500 mt-1">
            Built with security and privacy as the top priority
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-dark-900 flex flex-wrap justify-center md:justify-between gap-6 text-sm text-dark-400">
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/" className="hover:text-primary-400">Home</Link>
          <Link href="/register" className="hover:text-primary-400">Create Identity</Link>
          <Link href="/login" className="hover:text-primary-400">Log In</Link>
        </div>
        
        <div className="flex space-x-4 items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </footer>
  );
}