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
      className="group w-full p-5 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 text-gray-600 hover:text-blue-700 shadow-sm hover:shadow-md"
    >
      <div className="p-2 bg-white group-hover:bg-blue-600 rounded-lg transition-all duration-300 shadow-sm">
        <div className="group-hover:text-white transition-colors">
          {getIcon()}
        </div>
      </div>
      <span className="font-semibold text-base">{label}</span>
      <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>
  );
};