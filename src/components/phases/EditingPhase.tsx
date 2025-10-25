import React from 'react';
import { ManualEditor } from '../editing/ManualEditor';

export const EditingPhase: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <ManualEditor />
    </div>
  );
};