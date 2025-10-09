import React from 'react';

interface AddNodeButtonProps {
  onAdd: () => void;
  label: string;
  icon: 'section' | 'item' | 'bullet';
}

export const AddNodeButton: React.FC<AddNodeButtonProps> = ({ onAdd, label, icon }) => {
  const getIcon = () => {
    switch (icon) {
      case 'section':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'item':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'bullet':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
    }
  };

  return (
    <button
      onClick={onAdd}
      className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
    >
      <div className="p-1 bg-gray-100 hover:bg-blue-100 rounded-full transition-colors">
        {getIcon()}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
};