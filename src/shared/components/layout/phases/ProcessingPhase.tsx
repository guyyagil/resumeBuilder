import React from 'react';
import { ProcessingScreen } from '../../../../components/ProcessingScreen';

export const ProcessingPhase: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ProcessingScreen />
    </div>
  );
};
