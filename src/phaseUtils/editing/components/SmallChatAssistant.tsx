import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../../store';
import { GeminiService } from '../../../ai';
import type { ResumeNode } from '../../../types';
import { detectTextDirection } from '../../../utils';

interface SmallChatAssistantProps {
  onClose: () => void;
}

type AssistantMode = 'ask' | 'edit';

export const SmallChatAssistant: React.FC<SmallChatAssistantProps> = ({ onClose }) => {
  const { resumeTree, selectedBlocks, getNodeByAddress, clearBlockSelection, applyAction, jobDescription } = useAppStore();
  const [mode, setMode] = useState<AssistantMode>('ask');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI resume assistant.\n\nChoose a mode to get started:\n\n📝 **Ask Mode** - Get guidance and advice\n• Ask questions about how to improve your resume\n• Get suggestions for better wording\n• Receive strategic advice on structure and content\n\n✏️ **Edit Mode** - Make direct changes\n• AI will automatically update your resume\n• Add, modify, or delete sections\n• Reorder and restructure content\n\nTip: Click on blocks in your resume to cite them for more targeted help!'
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
        selectedContent += `${index + 1}. ADDRESS: "${addr}" | LAYOUT: [${node.layout}] | CONTENT: ${content}\n`;

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

  // Generate system prompt based on mode
  const getSystemPrompt = (currentMode: AssistantMode, userMessage: string): string => {
    const currentResumeContent = resumeTree.length > 0
      ? serializeResumeForContext(resumeTree)
      : '';
    const rootBlocksStructure = getRootBlocksStructure();
    const selectedBlocksContent = getSelectedBlocksContent();
    const fullResumeContent = currentResumeContent + rootBlocksStructure + selectedBlocksContent;

    const jobTailoringSection = jobDescription ? `

# TARGET JOB DESCRIPTION

${jobDescription}

` : '';

    if (currentMode === 'ask') {
      return `# SYSTEM CONTEXT (The user cannot see this section - this is for your internal guidance)

## Your Role
You are a professional resume advisor having a conversation with someone seeking advice about their resume.

## Communication Style
- Respond naturally and conversationally to the user's question
- Don't repeat back their question mechanically
- Provide specific, actionable advice
- Explain the "why" behind your suggestions
- Be encouraging but honest

## Available Context

### Resume Content
${fullResumeContent}

### Target Job (if provided)
${jobTailoringSection}
${jobDescription ? `IMPORTANT: The user is tailoring their resume for this specific job. Your advice should help them:
- Align their experience with the job requirements
- Incorporate relevant keywords naturally
- Highlight the most relevant qualifications
- Position themselves as the ideal candidate
` : 'No target job provided - give general resume best practices advice.'}

### Selected Sections (if any)
${selectedBlocksContent.length > 0 ? `The user has selected these specific sections of their resume for reference:
${selectedBlocksContent}
When they ask about "this" or "these sections," they're referring to the selected content above.
` : 'No sections selected - the user is asking about their resume generally.'}

## Important Constraints
- You are in "ASK MODE" - provide guidance and recommendations ONLY
- DO NOT generate any ACTIONS or JSON modifications
- Respond to the user's question naturally as a helpful advisor would

---

# USER'S QUESTION

${userMessage}

---

Now respond to the user's question naturally, using the context provided above to give helpful, specific advice.`;
    } else {
      return `# SYSTEM CONTEXT (The user cannot see this section - this is for your internal guidance)

## Your Role
You are a professional resume editor who makes direct changes to resumes based on user requests. You respond conversationally while generating structured modifications behind the scenes.

## Communication Style
- Respond naturally to the user's request
- Explain what you're changing and why in plain language
- Don't expose technical details (addresses, JSON) to the user
- Be confident and helpful

## Available Context

### Resume Structure
${fullResumeContent}

### Target Job (if provided)
${jobTailoringSection}
${jobDescription ? `CRITICAL: Tailor ALL edits to this specific job by:
- Using keywords and terminology from the job description
- Emphasizing relevant qualifications
- Highlighting matching experiences and skills
- Positioning the candidate as ideal for this role
` : 'No target job - apply general resume best practices.'}

### Selected Sections (if any)
${selectedBlocksContent.length > 0 ? `The user has selected these specific sections:
${selectedBlocksContent}

TARGETING RULES:
- Use the EXACT ADDRESS shown (e.g., "1.1", "2.3.1") in your actions
- Modify the "text" field for content changes (works for all layout types)
- For children under a heading, target the child's ADDRESS, not the heading's
- Never guess addresses - only use what's shown above
` : `No selections - when adding new content:
- Use parent: "0" for new top-level sections (0 represents root)
- Reference the ROOT LEVEL BLOCKS STRUCTURE for existing addresses
`}

## Available Actions (Backend Use Only)

1. UPDATE: {"action": "update", "id": "ADDRESS", "patch": {"text": "new content"}}
2. REMOVE: {"action": "remove", "id": "ADDRESS"}
3. APPEND CHILD: {"action": "appendChild", "parent": "ADDRESS_or_0", "node": {"layout": "list-item", "text": "content"}}
   - Use parent: "0" for adding root-level sections
   - Use parent: "1.2" (or any valid address) for adding children
4. INSERT SIBLING: {"action": "insertSibling", "after": "ADDRESS", "node": {"layout": "paragraph", "text": "content"}}
5. REORDER: {"action": "reorder", "id": "0", "order": ["1", "2", "3"]}
   - Use id: "0" to reorder root-level sections
   - The order array must contain ALL root section addresses

---

# USER'S REQUEST

${userMessage}

---

## Response Format

Respond with TWO distinct parts:

**Part 1 - EXPLANATION (shown to user):**
Write a natural, conversational response explaining what you're doing and why. Make it sound human and helpful.

**Part 2 - ACTIONS (hidden from user):**
On a new line, write "ACTIONS:" followed by a JSON array of modifications.

Example:
EXPLANATION: I'll strengthen your experience bullets to better highlight your achievements and align with the project management focus in the job description.

ACTIONS:
[{"action": "update", "id": "2.1", "patch": {"text": "Led cross-functional team of 8 to deliver $2M project 3 weeks ahead of schedule"}}]

Important:
- Use EXACT addresses from the context
- Keep the same language as the original content
- Ensure changes align with best practices${jobDescription ? ' and the target job' : ''}
`;
    }
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

      // Build a prompt based on the selected mode
      const systemPrompt = getSystemPrompt(mode, userMessage);

      // Filter out the initial assistant message and only pass user/assistant pairs
      const chatHistory = messages
        .slice(1)
        .slice(-5)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const result = await geminiService.processUserMessage(
        systemPrompt,
        [],
        currentResumeContent,
        chatHistory
      );

      const response = result.explanation;

      // Only parse actions if in Edit mode
      if (mode === 'edit') {
        const actionsMatch = response.match(/ACTIONS:\s*(\[[\s\S]*\])\s*$/m);

        if (actionsMatch) {
          try {
            let jsonString = actionsMatch[1].trim();
            let actions: any[];

            try {
              actions = JSON.parse(jsonString);
            } catch (firstError) {
              console.warn('⚠️ First JSON parse attempt failed, trying to fix common issues...');
              const arrayStart = jsonString.indexOf('[');
              const arrayEnd = jsonString.lastIndexOf(']');
              if (arrayStart !== -1 && arrayEnd !== -1) {
                jsonString = jsonString.substring(arrayStart, arrayEnd + 1);
                actions = JSON.parse(jsonString);
              } else {
                throw firstError;
              }
            }

            const explanation = response.split(/ACTIONS:\s*\[/)[0].replace('EXPLANATION:', '').trim();

            console.log('🤖 AI generated actions:', actions);
            console.log('📍 Selected block addresses:', selectedBlocks);

            // Validate that AI is targeting the correct blocks
            const validActions = actions.filter(action => {
              if (action.action === 'reorder') {
                if (!action.order || !Array.isArray(action.order)) {
                  console.warn(`⚠️ Reorder action missing valid 'order' array`);
                  return false;
                }

                const allValid = action.order.every((addr: string) => {
                  const node = getNodeByAddress(addr);
                  if (!node) {
                    console.warn(`⚠️ Reorder contains non-existent address: ${addr}`);
                    return false;
                  }
                  return true;
                });

                if (!allValid) return false;
                console.log(`✅ Reorder action validated with ${action.order.length} addresses`);
                return true;
              }

              if (action.action === 'appendChild') {
                const parent = action.parent;
                if (parent === '0') {
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

              if (action.action === 'insertSibling') {
                const refNode = getNodeByAddress(action.after);
                if (!refNode) {
                  console.warn(`⚠️ InsertSibling reference not found: ${action.after}`);
                  return false;
                }

                console.log(`✅ InsertSibling after ${action.after} validated`);
                return true;
              }

              if (action.action === 'move') {
                const node = getNodeByAddress(action.id);
                if (!node) {
                  console.warn(`⚠️ Move source not found: ${action.id}`);
                  return false;
                }

                const newParent = action.newParent;
                if (newParent !== '0') {
                  const parentNode = getNodeByAddress(newParent);
                  if (!parentNode) {
                    console.warn(`⚠️ Move target parent not found: ${newParent}`);
                    return false;
                  }
                }

                console.log(`✅ Move ${action.id} to ${action.newParent} validated`);
                return true;
              }

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

            for (const action of validActions) {
              console.log(`🔧 Applying action to node ${action.id}:`, action.patch);
              applyAction(action, `AI suggestion: ${userMessage}`);
            }

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `${explanation}\n\n✅ Applied ${validActions.length} change${validActions.length > 1 ? 's' : ''} to your resume.`
            }]);

            if (selectedBlocks.length > 0) {
              clearBlockSelection();
            }
          } catch (parseError) {
            console.error('❌ Failed to parse actions:', parseError);
            console.error('Raw response:', response);

            const errorExplanation = response.split(/ACTIONS:/)[0].replace('EXPLANATION:', '').trim() ||
              "I understood your request, but I had trouble formatting the changes properly.";

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `${errorExplanation}\n\n⚠️ I had trouble processing the technical details. Could you try rephrasing your request?`
            }]);
          }
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        }
      } else {
        // Ask mode - just show the response
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="p-5 border-b-2 border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-lg drop-shadow">AI Assistant</h3>
                {jobDescription && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full shadow-md">
                    Job-Targeted
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100">
                {selectedBlocks.length > 0
                  ? `${selectedBlocks.length} block${selectedBlocks.length > 1 ? 's' : ''} cited`
                  : 'Click blocks to cite them'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-all"
            title="Close chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mt-3 flex items-center space-x-2 bg-white/20 rounded-lg p-1">
          <button
            onClick={() => setMode('ask')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
              mode === 'ask'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            📝 Ask Mode
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
              mode === 'edit'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            ✏️ Edit Mode
          </button>
        </div>

        {/* Job Context Indicator */}
        {jobDescription && (
          <div className="mt-3 p-2 bg-purple-100 rounded-lg shadow-md">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-purple-800 font-semibold">
                Tailoring resume to target job role
              </span>
            </div>
          </div>
        )}

        {/* Selected Blocks Indicator */}
        {selectedBlocks.length > 0 && (
          <div className="mt-3 p-3 bg-white rounded-xl shadow-lg border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-md">
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
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {mode === 'ask'
                ? 'Ask me about these blocks for guidance'
                : 'I can modify these cited blocks'
              }
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
                className={`max-w-[85%] p-3 rounded-xl text-sm shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-white text-gray-900 border border-blue-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-xl border border-blue-200 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-600"></div>
                <span className="text-sm text-blue-700 font-medium">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-blue-200 bg-white">
        <div className="flex flex-col space-y-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            dir={detectTextDirection(inputMessage || 'en')}
            placeholder={
              mode === 'ask'
                ? (selectedBlocks.length > 0
                    ? "Ask me about the cited blocks..."
                    : "Ask for guidance or advice...")
                : (selectedBlocks.length > 0
                    ? "Tell me how to modify the cited blocks..."
                    : "Tell me what changes to make...")
            }
            className="w-full px-4 py-3 text-sm border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none bg-blue-50 focus:bg-white transition-colors"
            rows={3}
            disabled={isProcessing}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {mode === 'ask' ? '💡 Get advice and suggestions' : '✏️ AI will make direct edits'}
            </p>
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
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
