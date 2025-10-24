import React from 'react';
import { useAppStore } from '../../store';
import { Header } from './Header';
import { WelcomePhase } from '../phases/WelcomePhase';
import { ProcessingPhase } from '../phases/ProcessingPhase';
import { EditingPhase } from '../phases/EditingPhase';
import { LayoutSelectionPhase } from '../phases/LayoutSelectionPhase';
import { ColorSchemeSelectionPhase } from '../phases/ColorSchemeSelectionPhase';
import { DesignPhase } from '../phases/DesignPhase';
import logoImage from '../../assets/logo.png';

export const AppLayout: React.FC = () => {
  const phase = useAppStore(state => state.phase);

  return (
    <div className="h-screen flex flex-col relative">
      {/* Watermark Background Logo - Repeating Pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${logoImage})`,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          backgroundSize: '400px',
          opacity: 0.03
        }}
      />

      {/* Consistent Header Across All Phases */}
      <Header />

      {/* Main Content Area - Changes Per Phase (each phase has its own background) */}
      <main className="flex-1 overflow-hidden relative z-10">
        {phase === 'welcome' && <WelcomePhase />}
        {phase === 'processing' && <ProcessingPhase />}
        {phase === 'editing' && <EditingPhase />}
        {phase === 'layout-selection' && <LayoutSelectionPhase />}
        {phase === 'color-selection' && <ColorSchemeSelectionPhase />}
        {(phase === 'designing' || phase === 'active') && <DesignPhase />}
      </main>
    </div>
  );
};