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
    <header className="bg-gradient-to-b from-gray-200 to-gray-100 shadow-xl relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-300 after:to-transparent">
      <div className="max-w-[1920px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back Button */}
          <div className="w-32">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
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
              className="h-20 w-auto"
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
                            ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white'
                            : step.order === currentStep
                            ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white ring-4 ring-slate-200'
                            : 'bg-gray-300 text-gray-500'
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
                        step.order <= currentStep ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>

                    {/* Connector Line */}
                    {index < PHASE_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-16 transition-all ${
                          step.order < currentStep
                            ? 'bg-gradient-to-r from-slate-600 to-gray-700'
                            : 'bg-gray-300'
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
                className="flex items-center space-x-2 px-4 py-2 text-white bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 rounded-lg transition-all shadow-md"
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
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all font-medium"
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
