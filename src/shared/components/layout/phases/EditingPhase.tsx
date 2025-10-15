import React from 'react';
import { ManualEditor } from '../../../../features/editing/components/ManualEditor';

export const EditingPhase: React.FC = () => {
  return (
    <div className="h-full bg-gray-50">
      <ManualEditor />
    </div>
  );
};
