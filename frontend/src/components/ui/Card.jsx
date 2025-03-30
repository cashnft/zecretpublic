import React from 'react';

export default function Card({ 
  children, 
  title, 
  variant = 'default',
  className = '',
  ...props 
}) {
  const variantClasses = {
    default: 'bg-white dark:bg-dark-800',
    glass: 'bg-white/10 backdrop-blur-lg border border-white/20',
    outline: 'border border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800',
  };
  
  const cardClasses = `
    card
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <div className={cardClasses} {...props}>
      {title && (
        <div className="p-4 border-b border-dark-200 dark:border-dark-700">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}
      <div className={title ? 'p-4' : ''}>
        {children}
      </div>
    </div>
  );
}