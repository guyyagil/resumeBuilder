// src/components/ChatPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sendMessageToAI } from '../services/geminiService';
import type { AIResponse } from '../types';
import { handleResumeUpdates } from '../utils/resumeUpdateHandler';

interface ChatPanelProps {
  userBasicInfo: any;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ userBasicInfo }) => {
  const { chatMessages, addChatMessage, resume, targetJobPosting } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMessageSent = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Skip initial message - handled by WelcomeForm
  useEffect(() => {
    if (!initialMessageSent.current) {
      initialMessageSent.current = true;
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    addChatMessage(userMessage, 'user');

    try {
      const userContext = {
        ...userBasicInfo,
        targetJobPosting: targetJobPosting || userBasicInfo?.targetJobPosting,
        fullName: resume.fullName || userBasicInfo?.fullName,
      };

      const aiResponse = await sendMessageToAI(
        userMessage,
        userContext,
        resume,
        chatMessages
      ) as AIResponse;
      
      if (typeof aiResponse === 'object' && aiResponse.message) {
        addChatMessage(aiResponse.message, 'ai');
        
        if (aiResponse.resumeUpdates) {
          await handleResumeUpdates(aiResponse.resumeUpdates, addChatMessage);
        }
      } else {
        const message = typeof aiResponse === 'string' ? aiResponse : aiResponse.message;
        addChatMessage(message, 'ai');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur-sm shadow-lg flex flex-col h-[calc(100vh-2rem)]">
      <div className="p-4 border-b border-indigo-100 flex-shrink-0">
        <h2 className="font-bold text-lg bg-gradient-to-l from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
          שיחה עם ה-AI
        </h2>
        {targetJobPosting && (
          <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
            ✅ משרת יעד נטענה ({targetJobPosting.slice(0, 50)}...)
          </div>
        )}
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}
      >
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg p-3 max-w-[85%] ${
              message.type === 'user' 
                ? 'bg-blue-50 text-blue-900 border border-blue-100 ml-auto'     // כחול = משתמש
                : 'bg-white text-gray-900 border border-gray-200 shadow-sm'      // לבן = AI
            }`}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[85%] shadow-sm">
            <p className="text-sm text-gray-900">AI חושב...</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-indigo-100 flex gap-3 flex-shrink-0">
        <input
          dir="rtl"
          type="text" 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="כתוב הודעה או הוסף פרטים..." 
          className="flex-1 rounded-xl border border-indigo-200 bg-white/70 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          disabled={!inputMessage.trim() || isLoading}
        >
          שלח
        </button>
      </div>
    </div>
  );
};
