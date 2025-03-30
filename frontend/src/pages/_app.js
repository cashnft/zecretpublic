import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Add state to track if the app is running on client side
  const [isClient, setIsClient] = useState(false);

  // This effect runs only on the client after the component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create a loading component for when contexts aren't available
  const LoadingComponent = () => (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl">Loading application...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Zecret - Secure Anonymous Chat</title>
        <meta name="description" content="End-to-end encrypted anonymous messaging" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AuthProvider>
        {!isClient ? (
          // Show loading state during SSR or initial client render
          <LoadingComponent />
        ) : (
          // Only render ChatProvider and actual content when we're definitely client-side
          <ChatProvider>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                },
              }}
            />
          </ChatProvider>
        )}
      </AuthProvider>
    </>
  );
}

export default MyApp;