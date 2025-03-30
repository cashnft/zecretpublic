// Add this import at the top
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import CryptoUtils from '../utils/crypto';
import apiService from '../utils/api';
import io from 'socket.io-client'; // THIS WAS MISSING

// Create a global map to track message content to prevent duplication
// We'll use this instead of relying solely on message IDs
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
  }, [privateKey, activeConversation, user, getPublicKey]);
  
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
  const fetchOnlineUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getOnlineUsers();
      setOnlineUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
      toast.error('Could not fetch online users');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch message history
  const fetchMessages = useCallback(async (userId) => {
    if (!userId || !privateKey || !user) return;
    
    try {
      setLoading(true);
      
      // Clear existing message cache for this conversation
      globalMessageCache.clear(userId);
      
      const response = await apiService.getMessages(userId);
      const messages = response.data.messages || [];
      
      // Get keys for decryption
      const currentUserPublicKey = await getPublicKey(user.id);
      const otherUserPublicKey = await getPublicKey(userId);
      
      // Process messages
      const processedMessages = [];
      
      for (const msg of messages) {
        try {
          const isSentByCurrentUser = msg.sender_id === user.id;
          
          // Parse encrypted content
          let encryptedContent;
          try {
            encryptedContent = typeof msg.encrypted_content === 'string'
              ? JSON.parse(msg.encrypted_content)
              : msg.encrypted_content;
          } catch (error) {
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
          
          // Try to decrypt
          let decryptedMessage;
          let decryptionSucceeded = false;
          
          try {
            // Use appropriate public key based on sender
            const senderPublicKey = isSentByCurrentUser 
              ? currentUserPublicKey 
              : otherUserPublicKey;
              
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
                : "[Encrypted message - cannot decrypt]",
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
          
          // Add to processed messages (with deduplication)
          if (!globalMessageCache.hasSeen(userId, processedMessage)) {
            globalMessageCache.markSeen(userId, processedMessage);
            processedMessages.push(processedMessage);
          }
        } catch (error) {
          console.error('Error processing message:', msg.id, error);
        }
      }
      
      // Sort by timestamp
      processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Update conversation state
      setConversations(prev => ({
        ...prev,
        [userId]: processedMessages
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Could not fetch message history');
    } finally {
      setLoading(false);
    }
  }, [user, privateKey, getPublicKey]);
  
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
  
  // Start a conversation with a user
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
      
      // Fetch message history
      fetchMessages(userId);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Could not start conversation');
    }
  }, [user, socket, fetchMessages]);
  
  // Send a message
  const sendMessage = useCallback(async (text) => {
    if (!activeConversation || !privateKey || !user) return;
    
    try {
      // Get recipient's public key
      const recipientPublicKey = await getPublicKey(activeConversation.id);
      
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
      
      // Send via socket
      if (socket) {
        socket.emit('message', {
          room: activeConversation.room,
          secure_message: secureMessage,
          sender: {
            id: user.id,
            display_name: user.display_name
          }
        });
      }
      
      // Store via API
      try {
        const apiResponse = await apiService.sendMessage(secureMessage);
        
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
    const newSocket = io(socketURL, {
      query: { token },
      transports: ['websocket', 'polling'],
    });
    
    // Set up event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });
    
    newSocket.on('user_online', (data) => {
      setOnlineUsers((prev) => 
        prev.some(u => u.id === data.user.id) 
          ? prev 
          : [...prev, data.user]
      );
    });
    
    newSocket.on('user_offline', (data) => {
      setOnlineUsers((prev) => prev.filter(u => u.id !== data.user.id));
    });
    
    newSocket.on('message', (data) => {
      handleIncomingMessage(data);
    });
    
    // Save socket
    setSocket(newSocket);
    
    // Fetch online users
    fetchOnlineUsers();
    
    // Cleanup
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user, handleIncomingMessage, fetchOnlineUsers]);
  
  // Refresh online users periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
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
        fetchOnlineUsers
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};