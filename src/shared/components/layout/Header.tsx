import React from 'react';
import { useAppStore } from '../../../store';
import type { AppPhase } from '../../../shared/types';

interface PhaseStep {
  id: AppPhase;
  label: string;
  order: number;
}

const PHASE_STEPS: PhaseStep[] = [
  { id: 'welcome', label: 'Upload', order: 1 },
  { id: 'editing', label: 'Edit', order: 2 },
  { id: 'active', label: 'Design', order: 3 },
];

export const Header: React.FC = () => {
  const { phase, reset } = useAppStore();

  const handleBack = () => {
    if (phase === 'active' || phase === 'designing') {
      useAppStore.setState({ phase: 'editing' });
    } else if (phase === 'editing') {
      if (window.confirm('Go back to upload? Current progress will be lost.')) {
        reset();
      }
    }
  };

  const handleNext = () => {
    if (phase === 'editing') {
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
    if (phase === 'designing' || phase === 'active') return 3;
    return 1;
  };

  const currentStep = getCurrentStep();
  const canGoBack = phase !== 'welcome' && phase !== 'processing';
  const canGoNext = phase === 'editing';

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
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

          {/* Center: Brand + Progress */}
          <div className="flex-1 flex flex-col items-center space-y-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ResumeLab
            </h1>

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
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : step.order === currentStep
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100'
                            : 'bg-gray-200 text-gray-500'
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
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            : 'bg-gray-200'
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
                className="flex items-center space-x-2 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-md"
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
