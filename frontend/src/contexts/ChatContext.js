

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import CryptoUtils from '../utils/crypto';
import apiService from '../utils/api';
import io from 'socket.io-client'; 


const globalMessageCache = {
  // Format: { conversationId: Set<hash> }
  messages: {},
  
  // Hash the content of a message for comparison
  hashMessage(senderId, text, timestamp) {
    return `${senderId}:${text}:${timestamp.substring(0, 16)}`;
  },
  
  // Check if we've seen this message before
  hasSeen(conversationId, message) {
    if (!this.messages[conversationId]) {
      this.messages[conversationId] = new Set();
      return false;
    }
    
    const hash = this.hashMessage(
      message.senderId || message.sender_id,
      message.text,
      message.timestamp
    );
    
    return this.messages[conversationId].has(hash);
  },
  
  // Mark a message as seen
  markSeen(conversationId, message) {
    if (!this.messages[conversationId]) {
      this.messages[conversationId] = new Set();
    }
    
    const hash = this.hashMessage(
      message.senderId || message.sender_id,
      message.text,
      message.timestamp
    );
    
    this.messages[conversationId].add(hash);
  },
  
  // Clear messages for a conversation
  clear(conversationId) {
    delete this.messages[conversationId];
  }
};

// Create context
export const ChatContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const ChatProvider = ({ children }) => {
    const [messagePages, setMessagePages] = useState({});
    const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
    const [conversationMeta, setConversationMeta] = useState({});
    const MESSAGES_PER_PAGE = 20;
  const { user, privateKey, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [publicKeys, setPublicKeys] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  
  // === DEDUPLICATION SOLUTION ===
  // This is the key function that prevents duplicates
  const addMessageToConversation = (conversationId, message) => {
    // Check if we've seen this exact message before
    if (globalMessageCache.hasSeen(conversationId, message)) {
      console.log('Duplicate message detected, not adding:', 
        message.text.substring(0, 20) + (message.text.length > 20 ? '...' : ''));
      return;
    }
    
    // Mark this message as seen to prevent future duplicates
    globalMessageCache.markSeen(conversationId, message);
    
    // Now add the message to the conversation
    setConversations(prev => {
      const currentConversation = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: [...currentConversation, message]
      };
    });
  };
  
  // Function to handle incoming messages
  const handleIncomingMessage = useCallback(async (data) => {
    if (!privateKey || !user) return;
    
    try {

      const { sender, secure_message } = data;
    // Skip decryption for messages sent by current user
        if (sender.id === user.id && sender.id !== secure_message.recipient_id) {
            console.log('Skipping decryption for message sent by current user');
            
            // Create a placeholder message
            const newMessage = {
            id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            senderId: sender.id,
            text: "You sent an encrypted message",
            timestamp: new Date().toISOString(),
            senderName: sender.display_name,
            sentBySelf: true,
            encryptedContent: true
            };
            
            // Add to conversation (with deduplication)
            addMessageToConversation(sender.id, newMessage);
            return;
        }
      if (!sender || !secure_message) {
        console.error('Invalid message format:', data);
        return;
      }
      
      // Get sender's public key
      let senderPublicKey;
      try {
        senderPublicKey = await getPublicKey(sender.id);
      } catch (error) {
        console.error('Could not get sender public key:', error);
        return;
      }
      
      // Normalize the secure message
      const normalizedMessage = {
        ...secure_message,
        sender_id: secure_message.sender_id || sender.id,
        encrypted_content: secure_message.encrypted_content || secure_message.encrypted_message
      };
      
      // Decrypt the message
      let decryptedMessage;
      try {
        decryptedMessage = CryptoUtils.decryptSecureMessage(
          normalizedMessage,
          privateKey,
          senderPublicKey
        );
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        decryptedMessage = {
          sender_id: sender.id,
          text: '[Encrypted message - cannot decrypt]',
          timestamp: new Date().toISOString()
        };
      }
      
      // Prepare the message for display
      const newMessage = {
        id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: sender.id,
        text: decryptedMessage.text,
        timestamp: decryptedMessage.timestamp || new Date().toISOString(),
        senderName: sender.display_name
      };
      
      // Add to conversation (with deduplication)
      addMessageToConversation(sender.id, newMessage);
      
      // Handle notifications if not in active conversation
      if (activeConversation?.id !== sender.id) {
        setUnreadMessages(prev => ({
          ...prev,
          [sender.id]: (prev[sender.id] || 0) + 1
        }));
        
        toast.custom((t) => (
          <div className="bg-dark-800 text-white p-4 rounded-lg shadow-lg">
            <p className="font-bold">{sender.display_name || 'Anonymous'}</p>
            <p className="text-sm">New message received</p>
          </div>
        ));
      }
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }, [privateKey, activeConversation, user]);
  
  // Function to fetch a user's public key
  const getPublicKey = useCallback(async (userId) => {
    if (publicKeys[userId]) {
      return publicKeys[userId];
    }
    
    try {
      const response = await apiService.getUserPublicKey(userId);
      const publicKey = response.data.public_key;
      
      setPublicKeys(prev => ({
        ...prev,
        [userId]: publicKey
      }));
      
      return publicKey;
    } catch (error) {
      console.error('Error fetching public key:', error);
      throw error;
    }
  }, [publicKeys]);
  
  // Fetch online users
  const fetchOnlineUsers = useCallback(async (showLoading = false) => {
    try {
      // Only update loading state if showLoading is true
      if (showLoading) {
        setLoading(true);
      }
      
      const response = await apiService.getOnlineUsers();
      if (response && response.data && Array.isArray(response.data.users)) {
        // Update users without triggering a full re-render
        setOnlineUsers(prev => {
          // Only update if the list has actually changed
          const newUsers = response.data.users || [];
          
          // Check if arrays are the same by comparing IDs
          const prevIds = prev.map(u => u.id).sort().join(',');
          const newIds = newUsers.map(u => u.id).sort().join(',');
          
          return prevIds === newIds ? prev : newUsers;
        });
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      // Don't show error messages for background fetches
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);
  
  
  // Fetch message history
// Modify the fetchMessages function to support pagination
const fetchMessages = useCallback(async (userId, page = 1) => {
    if (!userId || !privateKey || !user) return;
    
    try {
      setLoading(page === 1); // Only show loading indicator for first page
      
      // Get all messages from API (we'll paginate client-side)
      const response = await apiService.getMessages(userId);
      const allMessages = response.data.messages || [];
      
      // Get keys for decryption
      const currentUserPublicKey = await getPublicKey(user.id);
      const otherUserPublicKey = await getPublicKey(userId);
      
      // Process all messages
      const processedMessages = [];
      
      for (const msg of allMessages) {
        try {
          const isSentByCurrentUser = msg.sender_id === user.id;
          
          // Parse encrypted content
          let encryptedContent;
          try {
            encryptedContent = typeof msg.encrypted_content === 'string'
              ? JSON.parse(msg.encrypted_content)
              : msg.encrypted_content;
          } catch (error) {
            // If parsing fails, use as is
            encryptedContent = msg.encrypted_content;
          }
          
          // Create secure message object
          const secureMessage = {
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            encrypted_content: encryptedContent,
            encrypted_key: msg.encrypted_key,
            signature: msg.signature,
            timestamp: msg.timestamp
          };
          
          // Skip decryption for messages sent by current user to others
          // This prevents the RSA padding errors
          if (isSentByCurrentUser && msg.sender_id !== msg.recipient_id) {
            // Just create a placeholder for messages sent by current user
            const processedMessage = {
              id: msg.id,
              senderId: msg.sender_id,
              recipientId: msg.recipient_id,
              text: "You sent an encrypted message",
              timestamp: msg.timestamp,
              senderName: user.display_name,
              sentBySelf: true,
              encryptedContent: true
            };
            
            processedMessages.push(processedMessage);
            continue; // Skip to next message
          }
          
          // Only try to decrypt messages sent to current user
          let decryptedMessage;
          let decryptionSucceeded = false;
          
          try {
            // Use appropriate public key based on sender
            const senderPublicKey = isSentByCurrentUser 
              ? otherUserPublicKey 
              : currentUserPublicKey;
              
            decryptedMessage = CryptoUtils.decryptSecureMessage(
              secureMessage,
              privateKey,
              senderPublicKey
            );
            decryptionSucceeded = true;
          } catch (error) {
            console.warn('Decryption failed for message:', msg.id);
            decryptedMessage = {
              text: isSentByCurrentUser 
                ? "Your encrypted message (sent to recipient)" 
                : "Encrypted message from " + (msg.sender_name || 'other user'),
              timestamp: msg.timestamp
            };
          }
          
          // Create message for display
          const processedMessage = {
            id: msg.id,
            senderId: msg.sender_id,
            recipientId: msg.recipient_id,
            text: decryptedMessage.text,
            timestamp: msg.timestamp,
            senderName: isSentByCurrentUser ? user.display_name : 'Other User',
            sentBySelf: isSentByCurrentUser,
            encryptedContent: !decryptionSucceeded
          };
          
          processedMessages.push(processedMessage);
        } catch (error) {
          console.error('Error processing message:', msg.id, error);
        }
      }
      
      // Sort by timestamp
      processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Store all processed messages
      const allProcessedMessages = processedMessages;
      
      // Calculate pagination
      const totalPages = Math.ceil(allProcessedMessages.length / MESSAGES_PER_PAGE);
      const pageSize = MESSAGES_PER_PAGE;
      

      if (page === 1) {
        // Get only the most recent messages for the first page
        const startIdx = Math.max(0, allProcessedMessages.length - pageSize);
        const recentMessages = allProcessedMessages.slice(startIdx);
        
        setConversations(prev => ({
          ...prev,
          [userId]: recentMessages
        }));
      } 
      // If loading more, prepend older messages
      else {
        // Calculate the range for this page
        const endIdx = Math.max(0, allProcessedMessages.length - ((page - 1) * pageSize));
        const startIdx = Math.max(0, endIdx - pageSize);
        const olderMessages = allProcessedMessages.slice(startIdx, endIdx);
        
        // Add older messages to the beginning of the conversation
        setConversations(prev => {
          const currentMessages = prev[userId] || [];
          return {
            ...prev,
            [userId]: [...olderMessages, ...currentMessages]
          };
        });
      }
      
      // Update hasMoreMessages state
      const hasMore = page < totalPages;
      
      // Save in context
      setConversationMeta(prev => ({
        ...prev,
        [userId]: {
          ...(prev[userId] || {}),
          hasMoreMessages: hasMore,
          totalPages: totalPages,
          currentPage: page
        }
      }));
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Could not fetch message history');
    } finally {
      setLoading(false);
    }
  }, [user, privateKey, getPublicKey, MESSAGES_PER_PAGE]);
  
  // Helper function to mark messages as error
  const markMessageError = useCallback((conversationId, messageId) => {
    setConversations(prev => {
      if (!prev[conversationId]) return prev;
      
      return {
        ...prev,
        [conversationId]: prev[conversationId].map(msg => {
          if (messageId ? msg.id === messageId : msg.pending) {
            return { ...msg, error: true, pending: false };
          }
          return msg;
        })
      };
    });
  }, []);
  

// Add a new function to load more messages
const loadMoreMessages = useCallback(async (userId) => {
    if (!userId || isLoadingMoreMessages || !user || !privateKey) return;
    
    try {
      setIsLoadingMoreMessages(true);
      
      // Increment the page for this conversation
      const nextPage = (messagePages[userId] || 1) + 1;
      setMessagePages(prev => ({
        ...prev, 
        [userId]: nextPage
      }));
      
      // Fetch the next page of messages
      await fetchMessages(userId, nextPage);
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Could not load more messages');
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [messagePages, isLoadingMoreMessages, user, privateKey, fetchMessages]);

const startConversation = useCallback(async (userId, userName) => {
    if (!userId || !user) return;
    
    try {
      // Create room name
      const roomName = [user.id, userId].sort().join('_');
      
      // Join room via socket
      if (socket) {
        socket.emit('join', { user_id: userId });
      }
      
      // Set active conversation
      setActiveConversation({
        id: userId,
        name: userName,
        room: roomName
      });
      
      // Clear unread messages
      setUnreadMessages(prev => ({
        ...prev,
        [userId]: 0
      }));
      
      // Initialize message page for this conversation if not exists
      if (!messagePages[userId]) {
        setMessagePages(prev => ({
          ...prev,
          [userId]: 1 // Start with page 1
        }));
      }
      
      // Fetch first page of messages (most recent)
      fetchMessages(userId, 1);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Could not start conversation');
    }
  }, [user, socket, messagePages]);
  // Send a message
  const sendMessage = useCallback(async (text) => {
    if (!activeConversation || !privateKey || !user) {
      console.error('Cannot send message: missing conversation, private key, or user data');
      return;
    }
    
    try {
      // Get recipient's public key
      const recipientPublicKey = await getPublicKey(activeConversation.id);
      
      if (!recipientPublicKey) {
        throw new Error('Could not retrieve recipient public key');
      }
      
      // Create a temporary message ID
      const tempMessageId = `temp-${Date.now()}`;
      
      // Prepare secure message
      const secureMessage = CryptoUtils.prepareSecureMessage(
        user.id,
        activeConversation.id,
        text,
        privateKey,
        recipientPublicKey
      );
      
      // Create temporary message for UI
      const tempMessage = {
        id: tempMessageId,
        senderId: user.id,
        text,
        timestamp: new Date().toISOString(),
        senderName: user.display_name,
        pending: true
      };
      
      // Add to conversation (with deduplication)
      addMessageToConversation(activeConversation.id, tempMessage);
      
      // Make sure we have the correct room name
      const roomName = [user.id, activeConversation.id].sort().join('_');
      
      console.log('Sending message to room:', roomName);
      
      // CRITICAL FIX: Send via socket with correct room name
      if (socket) {
        // First make sure we're in the room
        socket.emit('join', { 
          room: roomName,
          user_id: activeConversation.id
        });
        
        // Small delay to ensure join completes
        setTimeout(() => {
          // Then send the message with explicit room parameter
          socket.emit('message', {
            room: roomName,
            secure_message: secureMessage,
            sender: {
              id: user.id,
              display_name: user.display_name
            },
            // Add message ID to track this message
            id: tempMessageId
          });
          
          console.log('Message sent to socket with room:', roomName);
        }, 100);
      } else {
        console.error('Socket not available for sending message');
      }
      
      // Store via API
      try {
        console.log('Storing message via API...');
        const apiResponse = await apiService.sendMessage(secureMessage);
        console.log('API response:', apiResponse.data);
        
        // Update temporary message
        setConversations(prev => ({
          ...prev,
          [activeConversation.id]: prev[activeConversation.id].map(msg => 
            msg.id === tempMessageId ? { 
              ...msg, 
              id: apiResponse.data.id, 
              pending: false 
            } : msg
          )
        }));
      } catch (error) {
        console.error('Error sending message via API:', error);
        markMessageError(activeConversation.id, tempMessageId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      markMessageError(activeConversation.id, null);
    }
  }, [activeConversation, user, privateKey, socket, getPublicKey, markMessageError]);
  
 
// Initialize socket connection
useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Get token from storage
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Initialize socket
    const socketURL = API_URL;
    console.log('Initializing socket connection to:', socketURL);
    
    const newSocket = io(socketURL, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Set up event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      
      // If we have an active conversation, make sure we join that room
      if (activeConversation) {
        const roomName = [user.id, activeConversation.id].sort().join('_');
        console.log('Rejoining room after connection:', roomName);
        newSocket.emit('join', { 
          room: roomName,
          user_id: activeConversation.id
        });
      }
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    newSocket.on('user_online', (data) => {
      console.log('User online event:', data);
      setOnlineUsers((prev) => 
        prev.some(u => u.id === data.user.id) 
          ? prev 
          : [...prev, data.user]
      );
    });
    
    newSocket.on('user_offline', (data) => {
      console.log('User offline event:', data);
      setOnlineUsers((prev) => prev.filter(u => u.id !== data.user.id));
    });
    
    newSocket.on('joined', (data) => {
      console.log('Joined room successfully:', data);
    });
    
    newSocket.on('message', (data) => {
      console.log('Socket message received:', data);
      handleIncomingMessage(data);
    });
    
    // Save socket
    setSocket(newSocket);
    
    // Fetch online users
    fetchOnlineUsers();
    
    // Cleanup
    return () => {
      if (newSocket) {
        console.log('Disconnecting socket');
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user, activeConversation, handleIncomingMessage, fetchOnlineUsers]);
  
  // Refresh online users periodically
  // Initial fetch with loading indicator
useEffect(() => {
    if (isAuthenticated) {
      // First load - show loading state
      fetchOnlineUsers(true);
      
      // Background updates - no loading state
      const interval = setInterval(() => {
        fetchOnlineUsers(false);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOnlineUsers]);
  return (
    <ChatContext.Provider
      value={{
        onlineUsers,
        activeConversation,
        conversations,
        loading,
        unreadMessages,
        startConversation,
        sendMessage,
        fetchOnlineUsers,
        loadMoreMessages, // Add this new function
        isLoadingMoreMessages, // Add this state
        hasMoreMessages: userId => {
          // Helper function to check if there are more messages
          const meta = conversationMeta[userId] || {};
          return meta.hasMoreMessages || false;
        }
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

