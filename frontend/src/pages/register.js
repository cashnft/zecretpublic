import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser, loading } = useAuth();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  
  const onSubmit = async (data) => {
    const result = await registerUser(data.displayName);
    
    if (result.success) {
      setAccessCode(result.access_code);
      setPrivateKey(result.private_key);
      setRegistrationSuccess(true);
    }
  };
  
  const handleContinue = () => {
    router.push('/chat');
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
          <Link href="/login">
            <button className="btn btn-outline">Log In</button>
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
          {!registrationSuccess ? (
            <div className="glass-card p-8 rounded-xl">
              <h2 className="text-2xl font-bold mb-6 text-center">Create Anonymous Identity</h2>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                    Display Name (optional)
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    placeholder="Anonymous"
                    className="input"
                    {...register('displayName')}
                  />
                  <p className="mt-2 text-sm text-dark-400">
                    This will be visible to other users. You can use any name.
                  </p>
                </div>
                
                <div className="bg-dark-800/50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Important Information
                  </h3>
                  <p className="text-sm text-dark-300">
                    When you register, you'll receive an <strong>access code</strong> and <strong>private key</strong>. 
                    These must be saved securely – they cannot be recovered if lost! 
                    Without them, you won't be able to access your account again.
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? 'Creating Identity...' : 'Create Anonymous Identity'}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-dark-400">
                  Already have an identity? <Link href="/login" className="text-primary-400 hover:underline">Log In</Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Identity Created Successfully!</h2>
                <p className="text-dark-300">
                  Save your access credentials securely. They cannot be recovered if lost!
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Your Access Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={accessCode}
                    readOnly
                    className="input flex-1 font-mono"
                  />
                  <button 
                    className="ml-2 btn btn-dark"
                    onClick={() => navigator.clipboard.writeText(accessCode)}
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-sm text-dark-400">
                  This is used to log in to your account.
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Your Private Key
                </label>
                <div className="flex">
                  <textarea
                    value={privateKey}
                    readOnly
                    rows={3}
                    className="input flex-1 font-mono text-xs"
                  />
                  <button 
                    className="ml-2 btn btn-dark h-10"
                    onClick={() => navigator.clipboard.writeText(privateKey)}
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-sm text-dark-400">
                  This is used to decrypt your messages. It is stored locally in your browser,
                  but you should backup a copy in a secure location.
                </p>
              </div>
              
              <div className="bg-primary-900/30 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2 text-primary-400 flex items-center">
                  <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Security Warning
                </h3>
                <p className="text-sm text-dark-300">
                  Have you saved your access code and private key? If you lose them, 
                  your account and messages will be lost forever. There is no recovery process.
                </p>
              </div>
              
              <button
                className="btn btn-primary w-full py-3"
                onClick={handleContinue}
              >
                I've Saved My Credentials - Continue to Chat
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}