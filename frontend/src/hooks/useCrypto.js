import { useState, useCallback } from 'react';
import CryptoUtils from '../utils/crypto';
import { useAuth } from './useAuth';

export const useCrypto = () => {
  const { privateKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Encrypt a message
  const encryptMessage = useCallback(
    async (message, recipientPublicKey, senderId, recipientId) => {
      if (!privateKey || !recipientPublicKey) {
        setError('Missing key information for encryption');
        return null;
      }
      
      try {
        setLoading(true);
        
        const secureMessage = CryptoUtils.prepareSecureMessage(
          senderId,
          recipientId,
          message,
          privateKey,
          recipientPublicKey
        );
        
        return secureMessage;
      } catch (err) {
        console.error('Encryption error:', err);
        setError('Failed to encrypt message');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [privateKey]
  );
  
  // Decrypt a message
  const decryptMessage = useCallback(
    async (secureMessage, senderPublicKey) => {
      if (!privateKey || !senderPublicKey) {
        setError('Missing key information for decryption');
        return null;
      }
      
      try {
        setLoading(true);
        
        const decryptedMessage = CryptoUtils.decryptSecureMessage(
          secureMessage,
          privateKey,
          senderPublicKey
        );
        
        return decryptedMessage;
      } catch (err) {
        console.error('Decryption error:', err);
        setError('Failed to decrypt message');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [privateKey]
  );
  
  // Reset any errors
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    encryptMessage,
    decryptMessage,
    loading,
    error,
    resetError
  };
};

export default useCrypto;