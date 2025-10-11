import React from 'react';
import { ManualEditor } from '../../../../features/editing/components/ManualEditor';

export const EditingPhase: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ManualEditor />
    </div>
  );
};
