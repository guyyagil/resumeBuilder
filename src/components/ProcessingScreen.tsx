import React from 'react';
import { useAppStore } from '../store';

const STAGE_MESSAGES = {
  extracting: {
    title: 'Extracting text from PDF...',
    description: 'Reading your resume content',
  },
  structuring: {
    title: 'Analyzing your resume...',
    description: 'Understanding structure and sections',
  },
  designing: {
    title: 'Designing your resume...',
    description: 'Creating a beautiful, professional layout',
  },
};

export const ProcessingScreen: React.FC = () => {
  const processingStage = useAppStore((state) => state.processingStage);

  const stage = processingStage || 'extracting';
  const message = STAGE_MESSAGES[stage];

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <div className="text-center max-w-md px-6">
        {/* Animated spinner with gradient card background */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-12 border border-blue-100">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto">
              {/* Colorful animated circles */}
              <div className="relative flex items-center justify-center h-full">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
                {/* Middle spinning ring */}
                <div className="absolute inset-2 rounded-full border-4 border-cyan-200 border-t-cyan-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                {/* Inner pulsing dot */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Stage indicator */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            {message.title}
          </h2>
          <p className="text-gray-600 mb-8 text-lg">{message.description}</p>

          {/* Progress steps */}
          <div className="flex justify-center items-center space-x-4">
            <StepIndicator
              label="Extract"
              isActive={stage === 'extracting'}
              isCompleted={stage !== 'extracting'}
            />
            <div className={`h-1 w-12 transition-all rounded-full ${
              stage !== 'extracting' ? 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md' : 'bg-gray-200'
            }`} />
            <StepIndicator
              label="Analyze"
              isActive={stage === 'structuring'}
              isCompleted={stage === null}
            />
            <div className={`h-1 w-12 transition-all rounded-full ${
              stage === null ? 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md' : 'bg-gray-200'
            }`} />
            <StepIndicator
              label="Ready"
              isActive={stage === null}
              isCompleted={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepIndicatorProps {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  label,
  isActive,
  isCompleted,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
          isActive
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-blue-200 shadow-lg scale-110'
            : isCompleted
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        {isCompleted ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <div className="text-base font-bold">
            {label === 'Extract' ? '1' : label === 'Analyze' ? '2' : '3'}
          </div>
        )}
      </div>
      <span className={`text-xs font-semibold ${
        isActive || isCompleted ? 'text-blue-700' : 'text-gray-400'
      }`}>
        {label}
      </span>
    </div>
  );
};