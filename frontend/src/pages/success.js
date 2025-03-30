// src/pages/success.js
import React from 'react';
import Link from 'next/link';

// This ensures the page is always rendered at request time
export async function getServerSideProps() {
  return {
    props: {}
  };
}

export default function Success() {
  // Only render a minimal interface with a client script tag
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-900 to-dark-950 text-white">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8L19 15C19 17.2091 17.2091 19 15 19L9 19C6.79086 19 5 17.2091 5 15L5 8" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
              <rect x="7" y="4" width="10" height="6" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
              <path d="M12 12L12 16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="text-primary-500">Z</span>ecret
            </h1>
          </div>
        </Link>
      </header>
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 rounded-xl text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Identity Created Successfully!</h2>
            <p className="text-dark-300 mb-6">
              Save your access credentials securely. They cannot be recovered if lost!
            </p>
            
            <p className="mb-8">Your credentials are available in the URL parameters. Please copy them before navigating away.</p>
            
            <div className="flex flex-col space-y-3">
              <button
                className="btn btn-outline w-full py-3"
                onClick={() => {
                  // Client-side script to handle file save
                  const urlParams = new URLSearchParams(window.location.search);
                  const accessCode = urlParams.get('accessCode');
                  const privateKey = urlParams.get('privateKey');
                  
                  if (accessCode && privateKey) {
                    const data = {
                      accessCode,
                      privateKey,
                      createdAt: new Date().toISOString()
                    };
                    
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'zecret-credentials.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    alert('Credentials saved to file');
                  } else {
                    alert('No credentials found in URL');
                  }
                }}
              >
                Save Credentials to File
              </button>
              
              <Link href="/chat">
                <button className="btn btn-primary w-full py-3">
                  Continue to Chat
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Client-side script to display credentials */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const accessCode = urlParams.get('accessCode');
            const privateKey = urlParams.get('privateKey');
            
            if (!accessCode || !privateKey) {
              window.location.href = '/register';
            }
          } catch (e) {
            console.error('Error in client script:', e);
          }
        });
      `}} />
    </div>
  );
}