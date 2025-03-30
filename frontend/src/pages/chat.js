import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import UserList from '../components/chat/UserList';
import ChatContainer from '../components/chat/ChatContainer';

export default function Chat() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  // Add state to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);
  
  // Use chat context only after component is mounted
  const { 
    onlineUsers: rawOnlineUsers,
    activeConversation,
    conversations,
    loading: chatLoading,
    startConversation,
    sendMessage,
    fetchOnlineUsers,
    loadMoreMessages,
    isLoadingMoreMessages,
    hasMoreMessages
  } = useChat();
  
  // Ensure onlineUsers is always an array
  const onlineUsers = Array.isArray(rawOnlineUsers) ? rawOnlineUsers : [];
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    hasUsers: false,
    userCount: 0,
    isLoading: true
  });
  
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Set isMounted to true after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Get messages for active conversation - the pagination is now handled in the ChatContext
  const activeMessages = activeConversation 
    ? conversations[activeConversation.id] || []
    : [];
    
  // Log for debugging - this shows how many messages are being passed to ChatContainer
  useEffect(() => {
    if (activeMessages && activeMessages.length > 0) {
      console.log(`Rendering ${activeMessages.length} messages in active conversation`);
    }
  }, [activeMessages]);
  
  // Update debug info
  useEffect(() => {
    if (isMounted) {
      const info = {
        hasUsers: Array.isArray(onlineUsers) && onlineUsers.length > 0,
        userCount: Array.isArray(onlineUsers) ? onlineUsers.length : 0,
        isLoading: chatLoading,
        conversationActive: !!activeConversation,
        messagesCount: activeMessages.length
      };
      
      setDebugInfo(info);
      
      if (info.hasUsers) {
        console.log('Online users available:', onlineUsers.length);
      }
    }
  }, [isMounted, onlineUsers, chatLoading, activeConversation, activeMessages]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && !authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router, isMounted]);
  
  // Refresh online users periodically
  useEffect(() => {
    if (isMounted && isAuthenticated) {
      fetchOnlineUsers();
      const interval = setInterval(() => {
        fetchOnlineUsers();
      }, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOnlineUsers, isMounted]);
  
  // If not mounted yet (server-side) return loading state
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  const handleStartConversation = (userId, userName) => {
    startConversation(userId, userName);
    setShowMobileUsers(false); // Hide mobile user list after selection
  };
  
  // Handle loading and authentication states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will be redirected
  }
  
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col text-white">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer mr-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 8L19 15C19 17.2091 17.2091 19 15 19L9 19C6.79086 19 5 17.2091 5 15L5 8" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                <rect x="7" y="4" width="10" height="6" rx="2" stroke="#0EA5E9" strokeWidth="2"/>
                <path d="M12 12L12 16" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-xl font-bold tracking-tighter">
                <span className="text-primary-500">Z</span>ecret
              </span>
            </div>
          </Link>
          
          {/* Mobile Toggle for User List */}
          <button 
            className="md:hidden flex items-center space-x-1 text-dark-300 hover:text-white"
            onClick={() => setShowMobileUsers(!showMobileUsers)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 21C3 16.0294 7.02944 12 12 12C16.9706 12 21 16.0294 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{showMobileUsers ? 'Hide Users' : 'Show Users'}</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center text-dark-300">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span className="font-medium">{user?.display_name || 'Anonymous'}</span>
          </div>
          <button 
            onClick={logout}
            className="text-dark-300 hover:text-white flex items-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 17L21 12M21 12L16 7M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Show debug panel in development */}
      {process.env.NODE_ENV === 'development' && !debugInfo.hasUsers && !chatLoading && (
        <div className="bg-yellow-800/30 text-yellow-200 p-3 text-sm">
          <div className="container mx-auto">
            <h3 className="font-bold">Debug Info:</h3>
            <pre className="text-xs overflow-auto mt-1">{JSON.stringify(debugInfo, null, 2)}</pre>
            <button 
              onClick={fetchOnlineUsers}
              className="mt-2 bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
            >
              Manually Refresh Users
            </button>
          </div>
        </div>
      )}
      
      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* User List (Desktop) */}
        <div className="hidden md:block">
          <UserList 
            users={onlineUsers}
            loading={chatLoading}
            activeUserId={activeConversation?.id}
            onSelectUser={handleStartConversation}
          />
        </div>
        
        {/* Mobile User List (Conditional) */}
        {showMobileUsers && (
          <div className="absolute inset-0 z-10 bg-dark-950/95 md:hidden">
            <UserList
              users={onlineUsers}
              loading={chatLoading}
              activeUserId={activeConversation?.id}
              onSelectUser={handleStartConversation}
              isMobile={true}
              onClose={() => setShowMobileUsers(false)}
            />
          </div>
        )}
        
        {/* Chat Container - This component now uses the updated MessageList component */}
        <div className="flex-1">
          <ChatContainer
            activeConversation={activeConversation}
            messages={activeMessages}
            currentUserId={user?.id}
            sendMessage={sendMessage}
            loading={chatLoading}
          />
        </div>
      </div>
    </div>
  );
}