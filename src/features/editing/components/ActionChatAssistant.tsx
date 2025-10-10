import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../../store';
import { GeminiService } from '../../../shared/services/ai/GeminiClient';
import type { ResumeNode, AgentAction } from '../../../shared/types';

interface ActionChatAssistantProps {
  onClose: () => void;
}

export const ActionChatAssistant: React.FC<ActionChatAssistantProps> = ({ onClose }) => {
  const { 
    resumeTree, 
    selectedBlocks, 
    getNodeByAddress, 
    clearBlockSelection,
    applyAction 
  } = useAppStore();
  
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: selectedBlocks.length > 0 
        ? `I can see you've selected ${selectedBlocks.length} block${selectedBlocks.length > 1 ? 's' : ''}. I can help you improve them or make specific changes. What would you like me to do?`
        : 'Hi! Select blocks in your resume and I can help improve them, or ask me general questions about your resume content.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Serialize resume tree to text for AI context
  const serializeResumeForContext = (tree: ResumeNode[], depth: number = 0): string => {
    let result = '';
    for (const node of tree) {
      const indent = '  '.repeat(depth);
      const content = node.text || node.title || '';
      if (content.trim()) {
        result += `${indent}[${node.addr}] ${content}\n`;
      }
      if (node.children && node.children.length > 0) {
        result += serializeResumeForContext(node.children, depth + 1);
      }
    }
    return result;
  };

  // Get selected blocks content for AI context
  const getSelectedBlocksContent = (): string => {
    if (selectedBlocks.length === 0) return '';
    
    let selectedContent = '\n--- SELECTED BLOCKS FOR MODIFICATION ---\n';
    selectedBlocks.forEach((addr, index) => {
      const node = getNodeByAddress(addr);
      if (node) {
        const content = node.text || node.title || '';
        selectedContent += `${index + 1}. [Address: ${addr}] [Type: ${node.layout}] ${content}\n`;
        
        // Include children if any
        if (node.children && node.children.length > 0) {
          selectedContent += serializeResumeForContext(node.children, 1);
        }
      }
    });
    selectedContent += '--- END SELECTED BLOCKS ---\n\n';
    return selectedContent;
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment.');
      }

      const geminiService = new GeminiService(apiKey);
      
      // Get current resume content for context
      const currentResumeContent = resumeTree.length > 0 
        ? serializeResumeForContext(resumeTree)
        : '';
      
      // Add selected blocks context if any
      const selectedBlocksContent = getSelectedBlocksContent();
      const fullResumeContent = currentResumeContent + selectedBlocksContent;
      
      // Build a prompt that can generate actions
      const actionPrompt = `
You are a resume improvement assistant that can make specific changes to resume content.

CURRENT RESUME CONTENT:
${fullResumeContent}

USER REQUEST: ${userMessage}

INSTRUCTIONS:
1. If the user is asking for specific improvements to selected blocks, generate actions to modify them
2. If no blocks are selected, provide general guidance
3. For modifications, respond with both explanation AND actions

RESPONSE FORMAT:
If making changes, use this format:
EXPLANATION: [Your explanation of the changes]

ACTIONS:
[JSON array of actions, each action should be:]
{
  "action": "update",
  "id": "block_address",
  "patch": {
    "text": "new improved text"
  }
}

If just providing guidance, respond normally without the ACTIONS section.

EXAMPLE ACTIONS:
[
  {
    "action": "update", 
    "id": "1.1",
    "patch": {
      "text": "Led cross-functional team of 15+ employees, implementing strategic task allocation and quality assurance protocols that improved productivity by 25%"
    }
  }
]

Remember:
- Use the exact address from the selected blocks
- Keep the same language (Hebrew/English) as the original
- Make improvements that are professional and impactful
- Only generate actions if the user is asking for specific changes
`;

      const result = await geminiService.processUserMessage(
        actionPrompt,
        [],
        fullResumeContent,
        messages.slice(-5).map(msg => ({ role: msg.role, content: msg.content }))
      );

      // Parse the response to extract actions if any
      const response = result.explanation;
      const actionsMatch = response.match(/ACTIONS:\s*(\[[\s\S]*?\])/);
      
      if (actionsMatch) {
        try {
          const actions = JSON.parse(actionsMatch[1]) as AgentAction[];
          const explanation = response.replace(/ACTIONS:[\s\S]*$/, '').replace('EXPLANATION:', '').trim();
          
          // Apply the actions
          for (const action of actions) {
            applyAction(action, `AI suggestion: ${userMessage}`);
          }
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `${explanation}\n\n✅ Applied ${actions.length} change${actions.length > 1 ? 's' : ''} to your resume.`
          }]);
          
          // Clear selection after applying changes
          if (selectedBlocks.length > 0) {
            clearBlockSelection();
          }
        } catch (parseError) {
          console.error('Failed to parse actions:', parseError);
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickSuggestions = selectedBlocks.length > 0 ? [
    "Make this more professional and impactful",
    "Add quantifiable achievements to this",
    "Improve the wording and action verbs",
    "Make this more concise and powerful"
  ] : [
    "Help me improve my work experience section",
    "Suggest better action verbs throughout",
    "How can I quantify my achievements?",
    "Review my resume for improvements"
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Editor</h3>
              <p className="text-xs text-gray-500">
                {selectedBlocks.length > 0 
                  ? `${selectedBlocks.length} block${selectedBlocks.length > 1 ? 's' : ''} selected - I can modify them`
                  : 'Select blocks to make changes'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Selected Blocks Indicator */}
        {selectedBlocks.length > 0 && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-800 font-medium">
                Ready to modify selected content
              </span>
              <button
                onClick={clearBlockSelection}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">Making changes...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="space-y-1">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded text-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedBlocks.length > 0 ? "Tell me how to improve the selected blocks..." : "Ask me to improve your resume..."}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isProcessing}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};