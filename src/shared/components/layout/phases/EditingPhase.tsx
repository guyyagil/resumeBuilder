import React from 'react';
import { ManualEditor } from '../../../../features/editing/components/ManualEditor';

export const EditingPhase: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <ManualEditor />
    </div>
  );
};
