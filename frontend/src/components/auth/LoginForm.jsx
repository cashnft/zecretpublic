import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function LoginForm() {
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
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        {privateKeyPrompt ? 'Enter Your Private Key' : 'Log In to Zecret'}
      </h2>
      
      {!privateKeyPrompt ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="accessCode"
            label="Access Code"
            placeholder="Enter your access code"
            error={errors.accessCode && 'Access code is required'}
            helperText="This is the code you received when you registered."
            {...register('accessCode', { required: true })}
          />
          
          <Button 
            type="submit" 
            variant="primary"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Continue'}
          </Button>
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
            <Button 
              variant="outline"
              onClick={() => setPrivateKeyPrompt(false)}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              variant="primary"
              onClick={handlePrivateKeySubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}