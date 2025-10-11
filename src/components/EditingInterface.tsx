import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import type { EditInstruction } from '../features/editing/types/editing.types';
import { EditInstructionCard } from './EditInstructionCard';
import { ApplyChangesButton } from './ApplyChangesButton';



export const EditingInterface: React.FC = () => {
  const { messages, isProcessing } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const [editInstructions, setEditInstructions] = useState<EditInstruction[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, editInstructions]);

  const addEditInstruction = () => {
    if (!inputMessage.trim()) return;

    const newInstruction: EditInstruction = {
      id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: inputMessage.trim(),
      timestamp: Date.now(),
      status: 'pending',
      priority: 'medium'
    };

    setEditInstructions(prev => [...prev, newInstruction]);
    setInputMessage('');
  };

  const removeInstruction = (id: string) => {
    setEditInstructions(prev => prev.filter(inst => inst.id !== id));
  };

  const updateInstructionPriority = (id: string, priority: 'low' | 'medium' | 'high') => {
    setEditInstructions(prev => 
      prev.map(inst => inst.id === id ? { ...inst, priority } : inst)
    );
  };

  const clearAllInstructions = () => {
    setEditInstructions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEditInstruction();
    }
  };

  const pendingInstructions = editInstructions.filter(inst => inst.status === 'pending');
  const hasInstructions = pendingInstructions.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Resume Editor</h2>
          {hasInstructions && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {pendingInstructions.length} pending
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Add editing instructions below, then apply all changes at once for optimal results.
        </p>
      </div>

      {/* Instructions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {editInstructions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">No editing instructions yet</h3>
            <p className="text-sm text-gray-400 mb-4">
              Add instructions below to queue up changes to your resume.
            </p>
            <div className="text-left max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">Example instructions:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Make the summary more impactful"</li>
                <li>• "Add quantified achievements to work experience"</li>
                <li>• "Improve the skills section formatting"</li>
                <li>• "Strengthen action verbs in bullet points"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {editInstructions.map((instruction) => (
              <EditInstructionCard
                key={instruction.id}
                instruction={instruction}
                onRemove={removeInstruction}
                onUpdatePriority={updateInstructionPriority}
              />
            ))}
          </>
        )}

        {/* Chat Messages (for feedback and results) */}
        {messages.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              {messages.slice(-3).map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-50 text-blue-900 ml-8'
                      : 'bg-white text-gray-900 mr-8 shadow-sm'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div>{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3">
        {/* Apply Changes Button */}
        {hasInstructions && (
          <div className="flex items-center justify-between">
            <ApplyChangesButton
              instructions={pendingInstructions}
              isApplying={isApplying}
              onApplyStart={() => setIsApplying(true)}
              onApplyComplete={() => {
                setIsApplying(false);
                // Mark instructions as applied
                setEditInstructions(prev => 
                  prev.map(inst => 
                    inst.status === 'pending' ? { ...inst, status: 'applied' } : inst
                  )
                );
              }}
              onApplyError={() => setIsApplying(false)}
            />
            <button
              onClick={clearAllInstructions}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add an editing instruction (e.g., 'Make the summary more impactful')..."
            className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isProcessing || isApplying}
          />
          <button
            onClick={addEditInstruction}
            disabled={!inputMessage.trim() || isProcessing || isApplying}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};