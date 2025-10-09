import React from 'react';
import type { ChatMessage as ChatMessageType } from '../../shared/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {/* Show timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
        
        {/* Show action indicator if present */}
        {message.action && (
          <div
            className={`text-xs mt-1 px-2 py-1 rounded ${
              isUser
                ? 'bg-blue-500 text-blue-100'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            Action: {message.action.action}
          </div>
        )}
      </div>
    </div>
  );
};