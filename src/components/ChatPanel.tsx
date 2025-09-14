// src/components/ChatPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sendMessageToAI } from '../services/geminiService';
// import type { AIResponse } from '../types'; // Removed unused import
import { handleResumeUpdates } from '../utils/resumeUpdateHandler';

// Clean AI message from technical tags
const cleanAIMessage = (message: string): string => {
  if (!message) return '';
  
  return message
    // Remove RESUMEDATA tags and their content
    .replace(/\[RESUMEDATA\].*?\[\/RESUMEDATA\]/gs, '')
    .replace(/\[RESUME_DATA\].*?\[\/RESUME_DATA\]/gs, '')
    // Remove JSON code blocks
    .replace(/```json.*?```/gs, '')
    .replace(/```.*?```/gs, '')
    // Remove any remaining tags
    .replace(/\[\/RESUMEDATA\]/g, '')
    .replace(/\[RESUMEDATA\]/g, '')
    .replace(/\[\/RESUME_DATA\]/g, '')
    .replace(/\[RESUME_DATA\]/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Undo Button Component
const UndoButton: React.FC = () => {
  const { undo, resumeHistory } = useAppStore();
  const canUndo = resumeHistory.length > 0;

  const handleUndo = () => {
    if (canUndo) {
      undo();
    }
  };

  return (
    <button
      onClick={handleUndo}
      disabled={!canUndo}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${canUndo 
          ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:border-orange-300' 
          : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
        }
      `}
      title={canUndo ? 'בטל שינוי אחרון' : 'אין שינויים לביטול'}
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
        />
      </svg>
      בטל
    </button>
  );
};

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

      console.log('🔍 Sending context to AI:', {
        userContext,
        resumeData: resume,
        chatMessages: chatMessages // Send ALL messages for context
      });

      const aiResponse = await sendMessageToAI(
        userMessage,
        userContext,
        resume,
        chatMessages // Send ALL chat history, not just slice(-5)
      ) as any; // AIResponse type removed
      
      if (typeof aiResponse === 'object' && aiResponse.message) {
        // Handle resume updates FIRST, then send the message
        if (aiResponse.resumeUpdates) {
          await handleResumeUpdates(aiResponse.resumeUpdates, addChatMessage);
        }
        
        // Clean the message to ensure no RESUMEDATA tags appear in chat
        const cleanMessage = cleanAIMessage(aiResponse.message);
        addChatMessage(cleanMessage, 'ai');
      } else {
        const message = typeof aiResponse === 'string' ? aiResponse : aiResponse.message;
        const cleanMessage = cleanAIMessage(message);
        addChatMessage(cleanMessage, 'ai');
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
    <div
      className="rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur-sm shadow-lg flex flex-col h-[calc(100vh-2rem)]"
      style={{ fontFamily: 'Arial, sans-serif' }} // שינוי הפונט לאריאל
    >
      <div className="p-4 border-b border-indigo-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg bg-gradient-to-l from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            שיחה עם ה-AI
          </h2>
          <UndoButton />
        </div>
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
            <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
