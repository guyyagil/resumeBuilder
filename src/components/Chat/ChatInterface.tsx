import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatController } from '../../services/chatController';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const chatController = new ChatController(apiKey);

export const ChatInterface: React.FC = () => {
  const { messages, isProcessing } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (message: string) => {
    await chatController.sendMessage(message);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSend={handleSend}
        disabled={isProcessing}
      />
    </div>
  );
};