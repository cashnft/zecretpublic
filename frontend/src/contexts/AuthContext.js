import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
const isBrowser = typeof window !== 'undefined';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState(null);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
        if (!isBrowser) {
            setLoading(false);
            return;
          }
            
          const token = localStorage.getItem('token');
          const storedPrivateKey = localStorage.getItem('privateKey');
      if (token) {
        try {
          // Check if token is valid and not expired
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            throw new Error('Token expired');
          }
          
          // Set up axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user info
          const response = await axios.get(`${API_URL}/api/users/profile`);
          setUser(response.data.user);
          
          // If private key is stored, set it
          if (storedPrivateKey) {
            setPrivateKey(storedPrivateKey);
          } else {
            // If no private key, redirect to login
            throw new Error('No private key found');
          }
        } catch (error) {
          console.error('Auth error:', error);
          logout();
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Register a new user
  const register = async (displayName) => {
    try {
        setLoading(true);
        const response = await axios.post(`${API_URL}/api/register`, { display_name: displayName });
        
        const { user, token, access_code, private_key } = response.data;
        
        // Store token and private key
        if (isBrowser) {
          localStorage.setItem('token', token);
          localStorage.setItem('privateKey', private_key);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      
      setUser(user);
      setPrivateKey(private_key);
      
      // Return access code so it can be shown to the user
      return { success: true, access_code, private_key };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Login with access code
  const login = async (accessCode) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/login`, { access_code: accessCode });
      
      const { user, token } = response.data;
      
      // Ask for private key since the server doesn't store it
      const privateKeyInput = prompt('Please enter your private key:');
      if (!privateKeyInput) {
        throw new Error('Private key is required');
      }
      
      // Store token and private key
      localStorage.setItem('token', token);
      localStorage.setItem('privateKey', privateKeyInput);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setPrivateKey(privateKeyInput);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your access code and private key.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };


const logout = () => {
    if (isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('privateKey');
      delete axios.defaults.headers.common['Authorization'];
    }
    setUser(null);
    setPrivateKey(null);
    router.push('/');
  };

  const updateProfile = async (displayName) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/profile`, { display_name: displayName });
      setUser({ ...user, display_name: displayName });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        privateKey,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;