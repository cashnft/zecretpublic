// src/pages/index.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      }
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-900 to-dark-950 text-white">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
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
        <div className="flex space-x-4">
          <Link href="/login">
            <button className="btn btn-outline">Log In</button>
          </Link>
          <Link href="/register">
            <button className="btn btn-primary">Register</button>
          </Link>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-12 lg:py-0">
        <motion.div 
          className="lg:w-1/2 max-w-xl mb-12 lg:mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Secure, Anonymous, <span className="text-primary-500">End-to-End Encrypted</span> Chat
          </h2>
          <p className="text-lg text-dark-300 mb-8">
            Zecret provides truly anonymous communication with military-grade encryption. 
            No personal information required, no message content stored on servers, 
            and complete message integrity verification.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register">
              <button className="btn btn-primary px-8 py-3 text-lg shadow-glow">
                Create Identity
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className="btn btn-dark px-8 py-3 text-lg">
                How It Works
              </button>
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          className="lg:w-1/2 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-primary-500 blur-[100px] opacity-20 rounded-full"></div>
            <div className="relative glass-card p-8 rounded-2xl">
              <div className="mb-6 border-b border-white/10 pb-6">
                <div className="message-bubble message-received mb-3">
                  <p>How does this work? Is it really secure?</p>
                </div>
                <div className="message-bubble message-sent">
                  <p>Yes! All messages use end-to-end encryption. Nobody can read them except you and the recipient.</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Link href="/register">
                  <button className="btn btn-primary w-full">
                    Get Started Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-dark-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How Zecret Works</h2>
            <p className="text-lg text-dark-300 max-w-2xl mx-auto">
              Powerful cryptography and zero-knowledge design principles ensure your privacy
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass-card p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Anonymous Identity</h3>
              <p className="text-dark-300">
                Create an identity with no personal information. You'll receive an access code and private key - save these carefully!
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="glass-card p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-dark-300">
                Each message is encrypted on your device using military-grade cryptography. Only the recipient can decrypt and read it.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="glass-card p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Message Integrity</h3>
              <p className="text-dark-300">
                Digital signatures verify that messages haven't been tampered with and confirm the sender's identity.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 px-6 bg-dark-900">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 rounded-xl">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready for Truly Secure Communication?
            </h2>
            <p className="text-lg text-dark-300 mb-8">
              Join Zecret now and experience peace of mind with uncompromising privacy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <button className="btn btn-primary px-8 py-3 text-lg shadow-glow">
                  Create Anonymous Identity
                </button>
              </Link>
              <Link href="/login">
                <button className="btn btn-outline px-8 py-3 text-lg">
                  Log In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-dark-950 border-t border-dark-800">
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