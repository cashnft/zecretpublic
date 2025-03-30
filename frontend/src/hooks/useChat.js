// src/hooks/useChat.js
import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

// Define default values outside the hook to avoid recreating on each render
const defaultValues = {
  onlineUsers: [],
  activeConversation: null,
  conversations: {},
  loading: false,
  unreadMessages: {},
  startConversation: () => console.log('ChatContext not initialized - startConversation called'),
  sendMessage: () => console.log('ChatContext not initialized - sendMessage called'),
  fetchOnlineUsers: () => console.log('ChatContext not initialized - fetchOnlineUsers called')
};

export const useChat = () => {
  // Get the context safely
  let context = null;
  
  try {
    context = useContext(ChatContext);
  } catch (error) {
    console.warn('Error accessing ChatContext:', error);
    return defaultValues;
  }
  
  // If context is null or undefined, use default values
  if (!context) {
    //console.log('ChatContext is not available yet - using default values');
    return defaultValues;
  }
  
  // Return the real context
  return context;
};

export default useChat;