import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChatController } from '../../services/chatController';
import { JobDescriptionInput } from '../Controls/JobDescriptionInput';
import { ChatMessage } from './ChatMessage';

const chatController = new ChatController(
  import.meta.env.VITE_GEMINI_API_KEY || ''
);

export const ChatInterface: React.FC = () => {
  const { messages, isProcessing } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    
    try {
      await chatController.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Resume Assistant</h2>
        <JobDescriptionInput />
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-medium mb-2">Hi! I'm your AI resume assistant</h3>
            <p className="text-sm text-gray-400 mb-4">
              I can help you optimize your resume using natural language.
            </p>
            <div className="text-left max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">Try saying:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Make my summary more impactful"</li>
                <li>• "Add quantified achievements"</li>
                <li>• "Improve the skills section"</li>
                <li>• "Strengthen my work experience"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you'd like to improve about your resume..."
            className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isProcessing}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};