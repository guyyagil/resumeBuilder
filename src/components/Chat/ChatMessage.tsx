
import React from 'react';
import type { Message } from '../../types';
import { ActionPreview } from './ActionPreview';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, action, timestamp } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm">{content}</div>
        
        {action && <ActionPreview action={action} />}
        
        <div className="text-xs mt-1 opacity-70">
          {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
        </div>
      </div>
    </div>
  );
};
