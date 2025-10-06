import React from 'react';
import { Header } from './Header';
import { TreeChatInterface } from '../Chat/TreeChatInterface';
import { TreeResumePanel } from '../Resume/TreeResumePanel';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          <div className="order-2 lg:order-1">
            <TreeChatInterface />
          </div>
          <div className="order-1 lg:order-2">
            <TreeResumePanel />
          </div>
        </div>
      </div>
    </div>
  );
};