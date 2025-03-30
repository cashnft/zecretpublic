import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children, title = 'Zecret - Secure Anonymous Chat' }) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-900 to-dark-950 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content="End-to-end encrypted anonymous messaging" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 8L19 15C19 17.2091 17.2091 19 15 19L9 19C6.79086 19 5 17.2091 5 15L5 8" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                <rect x="7" y="4" width="10" height="6" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
                <path d="M12 12L12 16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="text-primary-500">Z</span>ecret
            </h1>
          </div>
        </Link>
        <div className="flex space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/chat">
                <button className="btn btn-outline">Chat</button>
              </Link>
              <button onClick={logout} className="btn btn-dark">
                Log Out
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

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-dark-800">
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
          <p className="text-sm text-dark-400">
            &copy; {new Date().getFullYear()} Zecret. All rights reserved. Built with security in mind.
          </p>
        </div>
      </footer>
    </div>
  );
}