import React, { useState } from 'react';

export default function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="p-4 border-t border-dark-800">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          placeholder="Type a secure message..."
          className="input flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />
        <button 
          type="submit"
          className="btn btn-primary px-4"
          disabled={!message.trim() || disabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5004 12H5.00043M4.91577 12.2915L2.58085 19.2662C2.39742 19.8142 2.3057 20.0881 2.37152 20.2569C2.42868 20.4031 2.55144 20.5152 2.70292 20.5591C2.87736 20.6099 3.14083 20.4925 3.66776 20.2578L20.3792 12.7557C20.8936 12.5258 21.1507 12.4109 21.2302 12.2683C21.2993 12.1452 21.2993 11.9974 21.2302 11.8743C21.1507 11.7317 20.8936 11.6168 20.3792 11.3869L3.66193 3.79179C3.13659 3.55903 2.87392 3.44265 2.69966 3.49348C2.54832 3.53747 2.42556 3.64942 2.36821 3.7954C2.30216 3.96402 2.3929 4.23728 2.57437 4.78381L4.91642 11.7856C4.94759 11.8795 4.96317 11.9264 4.96933 11.9744C4.97479 12.0171 4.97473 12.0602 4.96916 12.1029C4.96289 12.1509 4.94718 12.1977 4.91577 12.2915Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
      <div className="mt-2 flex items-center justify-center">
        <div className="flex items-center text-xs text-dark-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <path d="M16 8V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          End-to-end encrypted
        </div>
      </div>
    </div>
  );
}