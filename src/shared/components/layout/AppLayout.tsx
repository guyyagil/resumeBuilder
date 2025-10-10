import React from 'react';
import { useAppStore } from '../../../store';
import { Header } from './Header';
import { WelcomePhase } from './phases/WelcomePhase';
import { ProcessingPhase } from './phases/ProcessingPhase';
import { EditingPhase } from './phases/EditingPhase';
import { DesignPhase } from './phases/DesignPhase';

export const AppLayout: React.FC = () => {
  const phase = useAppStore(state => state.phase);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Consistent Header Across All Phases */}
      <Header />

      {/* Main Content Area - Changes Per Phase */}
      <main className="flex-1 overflow-hidden">
        {phase === 'welcome' && <WelcomePhase />}
        {phase === 'processing' && <ProcessingPhase />}
        {phase === 'editing' && <EditingPhase />}
        {(phase === 'designing' || phase === 'active') && <DesignPhase />}
      </main>
    </div>
  );
};
