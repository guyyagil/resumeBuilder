import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../../store';
import { GeminiService } from '../../../shared/services/ai/GeminiClient';
import { PromptBuilder } from '../../../shared/services/ai/PromptTemplates';
import type { ResumeNode } from '../../../shared/types';
import { detectTextDirection } from '../../../shared/utils/languageDetection';

interface SmallChatAssistantProps {
  onClose: () => void;
}

export const SmallChatAssistant: React.FC<SmallChatAssistantProps> = ({ onClose }) => {
  const { resumeTree, resumeTitle, selectedBlocks, getNodeByAddress, clearBlockSelection, applyAction } = useAppStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI resume assistant. I can:\n\n• Modify and improve your resume blocks\n• Add new sections or bullet points\n• Delete sections you don\'t need\n• Reorder sections\n• Suggest better wording and phrasing\n• Help with formatting and structure\n\n💡 Tip: Click on blocks in your resume to cite them as references, then ask me to improve, delete, or add content to them!'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Serialize resume tree to text for AI context with addresses
  const serializeResumeForContext = (tree: ResumeNode[], depth: number = 0): string => {
    let result = '';
    for (const node of tree) {
      const indent = '  '.repeat(depth);
      const content = node.text || node.title || '';
      const addr = node.addr || '?';
      if (content.trim()) {
        result += `${indent}[${addr}] ${content}\n`;
      }
      if (node.children && node.children.length > 0) {
        result += serializeResumeForContext(node.children, depth + 1);
      }
    }
    return result;
  };

  // Get root-level block addresses for reordering operations
  const getRootBlocksStructure = (): string => {
    if (resumeTree.length === 0) return '';

    let structure = '\n--- ROOT LEVEL BLOCKS STRUCTURE ---\n';
    structure += 'These are all the main sections in order:\n';
    resumeTree.forEach((node, index) => {
      const title = node.text || node.title || 'Untitled';
      structure += `${index + 1}. ADDRESS: "${node.addr}" | TITLE: ${title}\n`;
    });
    structure += '--- END ROOT BLOCKS STRUCTURE ---\n\n';
    return structure;
  };

  // Get selected blocks content for AI context
  const getSelectedBlocksContent = (): string => {
    if (selectedBlocks.length === 0) return '';

    let selectedContent = '\n--- SELECTED BLOCKS FOR REFERENCE ---\n';
    let hasHeadingsWithContent = false;

    selectedBlocks.forEach((addr, index) => {
      const node = getNodeByAddress(addr);
      if (node) {
        const content = node.text || node.title || '';
        // CRITICAL: Include the address so AI knows which block to modify
        selectedContent += `${index + 1}. ADDRESS: "${addr}" | LAYOUT: [${node.layout}] | CONTENT: ${content}\n`;

        // Include children if any (but note they have their own addresses)
        if (node.children && node.children.length > 0) {
          if (node.layout === 'heading') {
            hasHeadingsWithContent = true;
          }
          node.children.forEach((child) => {
            const childContent = child.text || child.title || '';
            if (childContent.trim() && child.addr) {
              selectedContent += `   - Child ADDRESS: "${child.addr}" | LAYOUT: [${child.layout}] | CONTENT: ${childContent}\n`;
            }
          });
        }
      }
    });

    if (hasHeadingsWithContent) {
      selectedContent += '\nNOTE: Some selected blocks are headings with content underneath. To modify the content (not the heading title), use the CHILD addresses shown above.\n';
    }

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

      // Add root blocks structure for reordering operations
      const rootBlocksStructure = getRootBlocksStructure();

      // Add selected blocks context if any
      const selectedBlocksContent = getSelectedBlocksContent();
      const fullResumeContent = currentResumeContent + rootBlocksStructure + selectedBlocksContent;
      
      // Build the chat prompt using centralized prompt builder
      const guidancePrompt = PromptBuilder.buildChatPrompt(
        userMessage,
        fullResumeContent,
        resumeTitle
      );

      // Build a prompt that can generate actions if user wants modifications
      const actionPrompt = selectedBlocksContent.length > 0 ? `
You are a resume improvement assistant that can make specific changes to resume content.

CURRENT RESUME CONTENT:
${fullResumeContent}

USER REQUEST: ${userMessage}

CRITICAL INSTRUCTIONS FOR TARGETING THE CORRECT BLOCKS:
1. The user has selected specific blocks with their ADDRESSES shown above in the "SELECTED BLOCKS FOR REFERENCE" section
2. Each block has an ADDRESS (e.g., "1.1", "2.3.1") - this is the EXACT identifier you MUST use in the "id" field
3. Look at the CONTENT field in the selected blocks to see what content to modify
4. IMPORTANT: Always modify the "text" field for content changes, regardless of layout type
   - Headings, containers, list-items, paragraphs all use the "text" field
   - Example: {"action": "update", "id": "1.1", "patch": {"text": "new content"}}
5. NEVER guess the address - use the EXACT address shown in the selected blocks
6. If the user wants to modify content inside a parent, look at the CHILDREN addresses and target those

AVAILABLE ACTIONS:
1. UPDATE - Modify the content of a block:
   {"action": "update", "id": "ADDRESS", "patch": {"text": "new content", "title": "new title"}}

2. REMOVE - Delete a block/section:
   {"action": "remove", "id": "ADDRESS"}

3. APPEND CHILD - Add a new child to a block (or to root with parent: "root"):
   {"action": "appendChild", "parent": "parent_ADDRESS_or_root", "node": {"layout": "paragraph", "text": "content"}}

4. INSERT SIBLING - Add a new block after another block:
   {"action": "insertSibling", "after": "reference_ADDRESS", "node": {"layout": "paragraph", "text": "content"}}

5. REORDER - Change the order of root-level sections (use ONLY for root blocks like "1", "2", "3", NOT nested like "1.1"):
   {"action": "reorder", "id": "", "order": ["new", "order", "of", "addresses"]}

   IMPORTANT FOR REORDER:
   - Use the "ROOT LEVEL BLOCKS STRUCTURE" section above to see all root addresses
   - The "id" field should be empty string "" for root-level reordering
   - The "order" array must contain ALL root addresses in the new desired order
   - Example: To move section "6" to first position when you have sections ["1", "2", "3", "4", "5", "6"]:
     {"action": "reorder", "id": "", "order": ["6", "1", "2", "3", "4", "5"]}

RESPONSE FORMAT:
If making changes, use this format:
EXPLANATION: [Your explanation of the changes]

ACTIONS:
[JSON array of actions - use the EXACT ADDRESS from the sections above]

EXAMPLE 1 - UPDATE content:
If selected block shows: "1. ADDRESS: "1.1" | LAYOUT: [container] | CONTENT: Some text"
Action: [{"action": "update", "id": "1.1", "patch": {"text": "Improved text"}}]

EXAMPLE 2 - DELETE a section:
If user wants to delete address "3":
Action: [{"action": "remove", "id": "3"}]

EXAMPLE 3 - ADD a new section to root:
If user wants to add a Certifications section:
Action: [{"action": "appendChild", "parent": "root", "node": {"layout": "heading", "title": "Certifications", "style": {"level": 1, "weight": "bold"}}}]

EXAMPLE 4 - ADD a bullet point to an existing section:
If user wants to add a bullet to address "2.1":
Action: [{"action": "appendChild", "parent": "2.1", "node": {"layout": "list-item", "text": "New achievement detail", "style": {"listMarker": "bullet"}}}]

EXAMPLE 5 - REORDER sections:
If user wants to move "פרטי קשר" (address "6") to be first, and root structure shows ["1", "2", "3", "4", "5", "6"]:
Action: [{"action": "reorder", "id": "", "order": ["6", "1", "2", "3", "4", "5"]}]

Remember:
- Use EXACT addresses from the sections above
- Match field name to layout type (title for headings, text for everything else)
- For reordering, include ALL root addresses in the new order
- For adding to root, use parent: "root"
- Keep the same language (Hebrew/English) as the original
- Only generate actions if the user is asking for specific changes
` : guidancePrompt;

      // Filter out the initial assistant message and only pass user/assistant pairs
      // Gemini requires first message to be 'user', so skip the welcome message
      const chatHistory = messages
        .slice(1) // Skip the initial assistant welcome message
        .slice(-5) // Only keep last 5 messages for context
        .map(msg => ({ role: msg.role, content: msg.content }));

      const result = await geminiService.processUserMessage(
        actionPrompt,
        [],
        fullResumeContent,
        chatHistory
      );

      // Parse the response to extract actions if any
      const response = result.explanation;
      const actionsMatch = response.match(/ACTIONS:\s*(\[[\s\S]*?\])/);

      if (actionsMatch) {
        try {
          const actions = JSON.parse(actionsMatch[1]) as any[];
          const explanation = response.replace(/ACTIONS:[\s\S]*$/, '').replace('EXPLANATION:', '').trim();

          console.log('🤖 AI generated actions:', actions);
          console.log('📍 Selected block addresses:', selectedBlocks);

          // Validate that AI is targeting the correct blocks
          const validActions = actions.filter(action => {
            // Handle reorder action separately
            if (action.action === 'reorder') {
              if (!action.order || !Array.isArray(action.order)) {
                console.warn(`⚠️ Reorder action missing valid 'order' array`);
                return false;
              }

              // Validate that all addresses in order exist
              const allValid = action.order.every((addr: string) => {
                const node = getNodeByAddress(addr);
                if (!node) {
                  console.warn(`⚠️ Reorder contains non-existent address: ${addr}`);
                  return false;
                }
                return true;
              });

              if (!allValid) {
                return false;
              }

              console.log(`✅ Reorder action validated with ${action.order.length} addresses`);
              return true;
            }

            // Handle appendChild action
            if (action.action === 'appendChild') {
              const parent = action.parent;
              if (parent === 'root' || parent === '') {
                console.log(`✅ AppendChild to root validated`);
                return true;
              }

              const parentNode = getNodeByAddress(parent);
              if (!parentNode) {
                console.warn(`⚠️ AppendChild parent not found: ${parent}`);
                return false;
              }

              console.log(`✅ AppendChild to ${parent} validated`);
              return true;
            }

            // Handle insertSibling action
            if (action.action === 'insertSibling') {
              const refNode = getNodeByAddress(action.after);
              if (!refNode) {
                console.warn(`⚠️ InsertSibling reference not found: ${action.after}`);
                return false;
              }

              console.log(`✅ InsertSibling after ${action.after} validated`);
              return true;
            }

            // Handle move action
            if (action.action === 'move') {
              const node = getNodeByAddress(action.id);
              if (!node) {
                console.warn(`⚠️ Move source not found: ${action.id}`);
                return false;
              }

              const newParent = action.newParent;
              if (newParent !== 'root' && newParent !== '') {
                const parentNode = getNodeByAddress(newParent);
                if (!parentNode) {
                  console.warn(`⚠️ Move target parent not found: ${newParent}`);
                  return false;
                }
              }

              console.log(`✅ Move ${action.id} to ${action.newParent} validated`);
              return true;
            }

            // Handle update/remove/replaceText actions that need an existing target
            const targetAddr = action.id;
            const node = getNodeByAddress(targetAddr);

            if (!node) {
              console.warn(`⚠️ AI tried to target non-existent address: ${targetAddr}`);
              return false;
            }

            console.log(`✅ Action ${action.action} on ${targetAddr} validated`);
            return true;
          });

          if (validActions.length === 0) {
            console.error('❌ No valid actions to apply');
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `${explanation}\n\n⚠️ I couldn't apply the changes because the target blocks were not found. Please try selecting the blocks again.`
            }]);
            return;
          }

          console.log(`✅ Applying ${validActions.length} valid actions`);

          // Apply the valid actions
          for (const action of validActions) {
            console.log(`🔧 Applying action to node ${action.id}:`, action.patch);
            applyAction(action, `AI suggestion: ${userMessage}`);
          }

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${explanation}\n\n✅ Applied ${validActions.length} change${validActions.length > 1 ? 's' : ''} to your resume.`
          }]);

          // Clear selection after applying changes
          if (selectedBlocks.length > 0) {
            clearBlockSelection();
          }
        } catch (parseError) {
          console.error('❌ Failed to parse actions:', parseError);
          console.error('Raw response:', response);
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
    "Improve the selected content",
    "Delete this section",
    "Add a bullet point under this section",
    "Rewrite with stronger action verbs"
  ] : [
    "Add a new Certifications section",
    "Add more details to my experience",
    "Delete empty or weak sections",
    "Reorder my sections to highlight strengths"
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-5 border-b-2 border-gray-300 bg-gradient-to-r from-slate-600 to-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">AI Assistant</h3>
              <p className="text-xs text-gray-200">
                {selectedBlocks.length > 0
                  ? `${selectedBlocks.length} block${selectedBlocks.length > 1 ? 's' : ''} cited`
                  : 'Click blocks to cite them'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Close chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Selected Blocks Indicator */}
        {selectedBlocks.length > 0 && (
          <div className="mt-3 p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-green-500 rounded-full">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-900 font-semibold">
                  {selectedBlocks.length} Block{selectedBlocks.length > 1 ? 's' : ''} Cited
                </span>
              </div>
              <button
                onClick={clearBlockSelection}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Ask me to improve, rewrite, or modify the cited content
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50">
        {messages.map((message, index) => {
          const textDir = detectTextDirection(message.content);
          return (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                dir={textDir}
                className={`max-w-[85%] p-3 rounded-xl text-sm shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          );
        })}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white">
          <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</p>
          <div className="space-y-2">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="w-full text-left text-xs p-3 bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-400 rounded-lg text-gray-700 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">→</span>
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t-2 border-gray-200 bg-white">
        <div className="flex flex-col space-y-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            dir={detectTextDirection(inputMessage || 'en')}
            placeholder={selectedBlocks.length > 0
              ? "Ask me to improve the cited blocks..."
              : "Ask for writing help or guidance..."}
            className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none bg-gray-50 focus:bg-white transition-colors"
            rows={3}
            disabled={isProcessing}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedBlocks.length > 0
                ? "💡 I can modify the cited blocks"
                : "💡 Tip: Select blocks first for targeted help"}
            </p>
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-600 to-gray-700 text-white text-sm font-semibold rounded-lg hover:from-slate-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>Send</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};