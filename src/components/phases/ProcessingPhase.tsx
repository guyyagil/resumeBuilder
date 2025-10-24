import React from 'react';
import { ProcessingScreen } from '../feedback/ProcessingScreen';

export const ProcessingPhase: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <ProcessingScreen />
    </div>
  );
};