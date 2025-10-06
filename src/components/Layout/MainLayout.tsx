import React from 'react';
import { Header } from './Header';
import { ResumeView } from '../Resume/ResumeView';
import { ChatInterface } from '../Chat/ChatInterface';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Resume Panel */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          <ResumeView />
        </div>
        
        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};