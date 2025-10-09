import React, { useState } from 'react';
import { Header } from './Header';
import { ResumeView } from '../Resume/ResumeView';
import { EditingInterface } from '../Chat/EditingInterface';
import { SimpleChatInterface } from '../Chat/SimpleChatInterface';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'edit' | 'chat'>('edit');

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Resume Panel */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          <ResumeView />
        </div>
        
        {/* Right Panel with Tabs */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'edit'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Resume</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat Assistant</span>
              </div>
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'edit' ? <EditingInterface /> : <SimpleChatInterface />}
          </div>
        </div>
      </div>
    </div>
  );
};