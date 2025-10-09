import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store';
import { OpenAIService } from '../../shared/services/ai/OpenAIClient';
import { ChatMessage } from './ChatMessage';

/**
 * Simple chat interface for general questions and conversations
 * Does not trigger resume edits - purely conversational
 */
export const SimpleChatInterface: React.FC = () => {
  const { messages, isProcessing, resumeTree, jobDescription } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // Add user message
    useAppStore.getState().addMessage({ role: 'user', content: message });
    useAppStore.getState().setProcessing(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      const openaiService = new OpenAIService(apiKey);
      
      // Get conversation history
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Use a conversational prompt instead of editing prompt
      const conversationalPrompt = `You are a helpful resume assistant. The user is asking a general question about their resume or career advice. 

DO NOT generate any actions or modifications. Just provide helpful, conversational responses.

Current resume context: ${resumeTree.length} sections
${jobDescription ? `Target job: ${jobDescription.substring(0, 200)}...` : 'No specific job target'}

User question: ${message}

Provide a helpful, conversational response. Do not include any JSON actions.`;

      const result = await openaiService.processUserMessage(
        conversationalPrompt,
        [], // No actions needed for chat
        jobDescription || '',
        history
      );

      // Only add the explanation, ignore any actions
      useAppStore.getState().addMessage({
        role: 'assistant',
        content: result.explanation,
      });

    } catch (error) {
      console.error('Chat error:', error);
      useAppStore.getState().addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      useAppStore.getState().setProcessing(false);
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
        <h3 className="text-lg font-semibold text-gray-900">Chat Assistant</h3>
        <p className="text-sm text-gray-600">
          Ask questions about your resume or get career advice
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">💬</div>
            <h4 className="text-lg font-medium mb-2">Start a conversation</h4>
            <p className="text-sm text-gray-400 mb-4">
              Ask me anything about your resume or career advice.
            </p>
            <div className="text-left max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">Example questions:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "How does my resume look overall?"</li>
                <li>• "What are the key strengths in my experience?"</li>
                <li>• "How well does this match the job description?"</li>
                <li>• "What career advice do you have for me?"</li>
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
                <span className="text-sm text-gray-600">Thinking...</span>
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
            placeholder="Ask me about your resume or career advice..."
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