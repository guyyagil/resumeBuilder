import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { TreeResumePanel } from './components/Resume/TreeResumePanel';
import { TreeChatInterface } from './components/Chat/TreeChatInterface';
import { TreeWelcomeForm } from './components/TreeWelcomeForm';

export const App: React.FC = () => {
  const { resumeTree, canUndo, canRedo, undo, redo } = useAppStore();
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Show welcome form until user uploads PDF and creates tree
  if (showWelcome || resumeTree.length === 0) {
    return (
      <TreeWelcomeForm 
        onComplete={() => setShowWelcome(false)} 
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Resume Builder</h1>
              <p className="text-gray-600 mt-1">
                Build and optimize your resume with AI assistance
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowWelcome(true)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                📄 New Resume
              </button>
              <button
                onClick={undo}
                disabled={!canUndo()}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↷ Redo
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* Chat Panel */}
          <div className="order-2 lg:order-1">
            <TreeChatInterface />
          </div>
          
          {/* Resume Panel */}
          <div className="order-1 lg:order-2">
            <TreeResumePanel />
          </div>
        </div>
        

      </div>
    </div>
  );
};