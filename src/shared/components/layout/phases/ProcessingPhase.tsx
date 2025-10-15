import React from 'react';
import { ProcessingScreen } from '../../../../components/ProcessingScreen';

export const ProcessingPhase: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <ProcessingScreen />
    </div>
  );
};
