import React from 'react';
import type { ChatMessage as ChatMessageType } from '../shared/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Displays a single chat message with role-based styling
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 shadow-sm'
        }`}
      >
        <div className="text-xs font-medium mb-1 opacity-75">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className="text-xs mt-1 opacity-50">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
