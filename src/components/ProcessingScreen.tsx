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
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {/* Animated spinner with white card background */}
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Stage indicator */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {message.title}
          </h2>
          <p className="text-gray-600 mb-8">{message.description}</p>

          {/* Progress steps */}
          <div className="flex justify-center items-center space-x-4">
            <StepIndicator
              label="Extract"
              isActive={stage === 'extracting'}
              isCompleted={stage !== 'extracting'}
            />
            <div className={`h-0.5 w-12 transition-all ${
              stage !== 'extracting' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-300'
            }`} />
            <StepIndicator
              label="Analyze"
              isActive={stage === 'structuring'}
              isCompleted={stage === null}
            />
            <div className={`h-0.5 w-12 transition-all ${
              stage === null ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-300'
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
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100'
            : isCompleted
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {isCompleted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <div className="text-sm font-semibold">
            {label === 'Extract' ? '1' : label === 'Analyze' ? '2' : '3'}
          </div>
        )}
      </div>
      <span className={`text-xs font-medium ${
        isActive || isCompleted ? 'text-gray-700' : 'text-gray-400'
      }`}>
        {label}
      </span>
    </div>
  );
};