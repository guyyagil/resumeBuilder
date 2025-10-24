import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { LAYOUT_STRUCTURES } from '../../phaseUtils/design/templates/layouts';
import { generateLayoutPreview } from '../../phaseUtils/design/templates/layoutPreviewGenerator';

export const LayoutSelectionPhase: React.FC = () => {
  const { setSelectedLayout } = useAppStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewLayout, setPreviewLayout] = useState<string | null>(null);

  // Generate previews for all layouts (memoized)
  const previews = useMemo(() => {
    const previewMap = new Map<string, string>();
    LAYOUT_STRUCTURES.forEach(layout => {
      previewMap.set(layout.type, generateLayoutPreview(layout));
    });
    return previewMap;
  }, []);

  const handleSelectLayout = (layoutType: string) => {
    setSelectedType(layoutType);
    const layout = LAYOUT_STRUCTURES.find(l => l.type === layoutType);
    if (layout) {
      setSelectedLayout(layout);
    }
  };

  const handlePreview = (layoutType: string) => {
    setPreviewLayout(layoutType);
  };

  const handleClosePreview = () => {
    setPreviewLayout(null);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Choose Your Resume Layout</h1>
        <p className="text-gray-600 text-lg">Select a layout structure that best showcases your content</p>
        <p className="text-sm text-blue-600 font-medium mt-2">You'll choose colors in the next step</p>
      </div>

      {/* Layout Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {LAYOUT_STRUCTURES.map((layout) => {
            const isSelected = selectedType === layout.type;

            return (
              <div
                key={layout.type}
                className={`group relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border ${
                  isSelected ? 'ring-4 ring-blue-400 shadow-2xl scale-105 border-blue-200' : 'border-blue-100'
                }`}
                onClick={() => handleSelectLayout(layout.type)}
              >
                {/* Preview Thumbnail */}
                <div className="aspect-[210/297] bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden relative border-b-4 border-blue-100">
                  <iframe
                    srcDoc={previews.get(layout.type)}
                    className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
                    style={{
                      width: '200%',
                      height: '200%',
                    }}
                    title={`${layout.name} preview`}
                  />

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(layout.type);
                      }}
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      Preview Full Size
                    </button>
                  </div>

                  {/* Selection Badge */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-xl flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Selected</span>
                    </div>
                  )}
                </div>

                {/* Layout Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{layout.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{layout.description}</p>

                  {/* Layout Features */}
                  <div className="flex flex-wrap gap-2">
                    {layout.structure.hasSidebar && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {layout.structure.sidebarPosition === 'left' ? 'Left Sidebar' : 'Right Sidebar'}
                      </span>
                    )}
                    {layout.structure.hasLargeName && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        Large Header
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      {layout.typography.bodySpacing === 'spacious' ? 'Spacious' : layout.typography.bodySpacing === 'compact' ? 'Compact' : 'Balanced'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {previewLayout && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={handleClosePreview}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-full overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full Preview */}
            <iframe
              srcDoc={previews.get(previewLayout)}
              className="w-full h-full"
              title="Full size preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};