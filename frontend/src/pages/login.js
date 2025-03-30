import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, loading } = useAuth();
  const [privateKeyPrompt, setPrivateKeyPrompt] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const onSubmit = async (data) => {
    setAccessCode(data.accessCode);
    setPrivateKeyPrompt(true);
  };
  
  const handlePrivateKeySubmit = async () => {
    if (!privateKey) {
      toast.error('Private key is required');
      return;
    }
    
    // Store private key in localStorage first (login will prompt for it but we already have it)
    localStorage.setItem('privateKey', privateKey);
    
    const result = await login(accessCode);
    
    if (result.success) {
      router.push('/chat');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-900 to-dark-950 text-white">
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
        <div>
          <Link href="/register">
            <button className="btn btn-primary">Register</button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass-card p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {privateKeyPrompt ? 'Enter Your Private Key' : 'Log In to Zecret'}
            </h2>
            
            {!privateKeyPrompt ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <label htmlFor="accessCode" className="block text-sm font-medium mb-2">
                    Access Code
                  </label>
                  <input
                    id="accessCode"
                    type="text"
                    placeholder="Enter your access code"
                    className={`input ${errors.accessCode ? 'border-red-500' : ''}`}
                    {...register('accessCode', { required: true })}
                  />
                  {errors.accessCode && (
                    <p className="mt-1 text-sm text-red-500">
                      Access code is required
                    </p>
                  )}
                  <p className="mt-2 text-sm text-dark-400">
                    This is the code you received when you registered.
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? 'Logging In...' : 'Continue'}
                </button>
              </form>
            ) : (
              <div>
                <div className="mb-6">
                  <label htmlFor="privateKey" className="block text-sm font-medium mb-2">
                    Private Key
                  </label>
                  <textarea
                    id="privateKey"
                    placeholder="Paste your private key here"
                    className="input font-mono text-xs"
                    rows={5}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-dark-400">
                    This key is used to decrypt your messages. It is never sent to the server.
                  </p>
                </div>
                
                <div className="bg-dark-800/50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Privacy Information
                  </h3>
                  <p className="text-sm text-dark-300">
                    Your private key is stored only in your browser and is never sent to our servers.
                    It will be used to decrypt messages and verify authenticity.
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <button 
                    className="btn btn-outline flex-1"
                    onClick={() => setPrivateKeyPrompt(false)}
                  >
                    Back
                  </button>
                  <button 
                    className="btn btn-primary flex-1"
                    onClick={handlePrivateKeySubmit}
                    disabled={loading}
                  >
                    {loading ? 'Logging In...' : 'Log In'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-dark-400">
                Don't have an identity? <Link href="/register" className="text-primary-400 hover:underline">Create one</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}