import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function RegisterForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser, loading } = useAuth();
  
  const onSubmit = async (data) => {
    const result = await registerUser(data.displayName);
    
    if (result.success) {
      // Redirect to success page with credentials
      router.push({
        pathname: '/success',
        query: { 
          accessCode: result.access_code,
          privateKey: result.private_key
        }
      });
    }
  };
  
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Create Anonymous Identity</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="displayName"
          label="Display Name (optional)"
          placeholder="Anonymous"
          helperText="This will be visible to other users. You can use any name."
          {...register('displayName')}
        />
        
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
        
        <Button 
          type="submit" 
          variant="primary"
          fullWidth
          size="lg"
          disabled={loading}
        >
          {loading ? 'Creating Identity...' : 'Create Anonymous Identity'}
        </Button>
      </form>
    </motion.div>
  );
}