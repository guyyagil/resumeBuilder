import React from 'react';
import { useAppStore } from '../../../store';
import type { AppPhase } from '../../../shared/types';
import logoImage from '../../../assets/logo.png';

interface PhaseStep {
  id: AppPhase;
  label: string;
  order: number;
}

const PHASE_STEPS: PhaseStep[] = [
  { id: 'welcome', label: 'Upload', order: 1 },
  { id: 'editing', label: 'Edit', order: 2 },
  { id: 'layout-selection', label: 'Layout', order: 3 },
  { id: 'color-selection', label: 'Colors', order: 4 },
  { id: 'active', label: 'Design', order: 5 },
];

export const Header: React.FC = () => {
  const { phase, reset, selectedLayout, selectedColorScheme } = useAppStore();

  const handleBack = () => {
    if (phase === 'active' || phase === 'designing') {
      useAppStore.setState({ phase: 'color-selection' });
    } else if (phase === 'color-selection') {
      useAppStore.setState({ phase: 'layout-selection' });
    } else if (phase === 'layout-selection') {
      useAppStore.setState({ phase: 'editing' });
    } else if (phase === 'editing') {
      if (window.confirm('Go back to upload? Current progress will be lost.')) {
        reset();
      }
    }
  };

  const handleNext = () => {
    if (phase === 'editing') {
      // Go to layout selection
      useAppStore.setState({ phase: 'layout-selection' });
    } else if (phase === 'layout-selection') {
      // Go to color selection
      useAppStore.setState({ phase: 'color-selection' });
    } else if (phase === 'color-selection') {
      // Start design generation
      const { startDesignPhase } = useAppStore.getState();
      startDesignPhase().catch(error => {
        console.error('Failed to start design phase:', error);
        alert('Failed to generate design. Please try again.');
      });
    }
  };

  // Map current phase to step
  const getCurrentStep = (): number => {
    if (phase === 'welcome') return 1;
    if (phase === 'processing' || phase === 'editing') return 2;
    if (phase === 'layout-selection') return 3;
    if (phase === 'color-selection') return 4;
    if (phase === 'designing' || phase === 'active') return 5;
    return 1;
  };

  const currentStep = getCurrentStep();
  const canGoBack = phase !== 'welcome' && phase !== 'processing' && phase !== 'designing';
  const canGoNext =
    phase === 'editing' ||
    (phase === 'layout-selection' && selectedLayout !== null) ||
    (phase === 'color-selection' && selectedColorScheme !== null);

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-white shadow-2xl relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>

      <div className="max-w-[1920px] mx-auto px-8 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Left: Back Button */}
          <div className="w-32">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            )}
          </div>

          {/* Center: Logo + Progress */}
          <div className="flex-1 flex flex-col items-center space-y-3">
            {/* Logo */}
            <img
              src={logoImage}
              alt="ResumeLab"
              className="h-20 w-auto drop-shadow-xl"
            />
            {/* Progress Indicator */}
            {phase !== 'error' && (
              <div className="flex items-center space-x-2">
                {PHASE_STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    {/* Step Circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          step.order < currentStep
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg'
                            : step.order === currentStep
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white ring-4 ring-white/50 shadow-xl scale-110'
                            : 'bg-white/30 text-white/70 backdrop-blur-sm'
                        }`}
                      >
                        {step.order < currentStep ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.order
                        )}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${
                        step.order <= currentStep ? 'text-white drop-shadow' : 'text-white/60'
                      }`}>
                        {step.label}
                      </span>
                    </div>

                    {/* Connector Line */}
                    {index < PHASE_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-16 transition-all rounded-full ${
                          step.order < currentStep
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-md'
                            : 'bg-white/30'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Right: Next/New Button */}
          <div className="w-32 flex justify-end">
            {canGoNext && (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <span className="font-medium">Next</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {(phase === 'active' || phase === 'designing') && (
              <button
                onClick={() => {
                  if (window.confirm('Start a new resume? Current progress will be lost.')) {
                    reset();
                  }
                }}
                className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all font-medium backdrop-blur-sm"
              >
                New
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
