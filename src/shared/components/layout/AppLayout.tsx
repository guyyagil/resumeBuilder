import React from 'react';
import { Header } from './Header';
import { ResumePreview } from '../../../features/resume/components/ResumePreview';
import { ManualEditor } from '../../../features/editing/components/ManualEditor';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Resume Preview Panel */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          <ResumePreview />
        </div>
        
        {/* Manual Editor Panel */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          <ManualEditor />
        </div>
      </div>
    </div>
  );
};

