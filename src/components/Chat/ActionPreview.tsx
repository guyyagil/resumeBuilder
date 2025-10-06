
import React from 'react';
import type { AgentAction } from '../../types';

interface ActionPreviewProps {
  action: AgentAction;
}

export const ActionPreview: React.FC<ActionPreviewProps> = ({ action }) => {
  return (
    <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-xs">
      <strong>Action:</strong> {action.action}
      {'id' in action && ` at ${action.id}`}
    </div>
  );
};
