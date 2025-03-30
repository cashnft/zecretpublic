import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  label,
  error,
  className = '',
  fullWidth = true,
  helperText,
  ...props 
}, ref) => {
  const inputClasses = `
    input
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-dark-400">
          {helperText}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;