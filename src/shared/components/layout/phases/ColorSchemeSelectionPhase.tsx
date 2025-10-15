import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../../store';
import { COLOR_SCHEMES } from '../../../../features/design/templates/colorSchemes';
import { generateLayoutPreview } from '../../../../features/design/templates/layoutPreviewGenerator';

export const ColorSchemeSelectionPhase: React.FC = () => {
  const { selectedLayout, setSelectedColorScheme } = useAppStore();
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [previewSchemeId, setPreviewSchemeId] = useState<string | null>(null);

  // Generate preview with selected layout and different color schemes
  const basePreview = useMemo(() => {
    if (!selectedLayout) return '';
    return generateLayoutPreview(selectedLayout);
  }, [selectedLayout]);

  const handleSelectScheme = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    if (scheme) {
      setSelectedColorScheme(scheme);
    }
  };

  const applyColorToPreview = (preview: string, scheme: typeof COLOR_SCHEMES[0]): string => {
    return preview
      .replace(/#333/g, scheme.colors.text)
      .replace(/#666/g, scheme.colors.textLight)
      .replace(/#555/g, scheme.colors.textLight)
      .replace(/#000/g, scheme.colors.primary)
      .replace(/#ddd/g, scheme.colors.accent)
      .replace(/#f5f5f5/g, scheme.colors.sidebarBg || '#f5f5f5')
      .replace(/#f0f0f0/g, scheme.colors.accent + '20')
      .replace(/#e5e5e5/g, scheme.colors.accent + '30')
      .replace(/#999/g, scheme.colors.accent);
  };

  if (!selectedLayout) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <div className="text-center">
          <p className="text-xl text-gray-600">Please select a layout first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Choose Your Color Scheme</h1>
        <p className="text-gray-600 text-lg">Select colors that match your style and industry</p>
        <p className="text-sm text-blue-600 font-medium mt-2">
          Layout: <span className="font-bold">{selectedLayout.name}</span>
        </p>
      </div>

      {/* Color Scheme Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedSchemeId === scheme.id;
            const coloredPreview = applyColorToPreview(basePreview, scheme);

            return (
              <div
                key={scheme.id}
                className={`group relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border ${
                  isSelected ? 'ring-4 ring-blue-400 shadow-2xl scale-105 border-blue-200' : 'border-blue-100'
                }`}
                onClick={() => handleSelectScheme(scheme.id)}
              >
                {/* Preview Thumbnail */}
                <div className="aspect-[210/297] bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden relative">
                  <iframe
                    srcDoc={coloredPreview}
                    className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
                    style={{
                      width: '200%',
                      height: '200%',
                    }}
                    title={`${scheme.name} preview`}
                  />

                  {/* Overlay with preview button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewSchemeId(scheme.id);
                      }}
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      Preview
                    </button>
                  </div>

                  {/* Selection Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-xl flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Selected</span>
                    </div>
                  )}
                </div>

                {/* Color Scheme Info */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3">{scheme.name}</h3>

                  {/* Color Palette */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-full h-10 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: scheme.colors.primary }}
                      />
                      <span className="text-xs text-gray-500 mt-1">Primary</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-full h-10 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: scheme.colors.accent }}
                      />
                      <span className="text-xs text-gray-500 mt-1">Accent</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-full h-10 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: scheme.colors.secondary }}
                      />
                      <span className="text-xs text-gray-500 mt-1">Secondary</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {previewSchemeId && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewSchemeId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-full overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewSchemeId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full Preview */}
            <iframe
              srcDoc={applyColorToPreview(
                basePreview,
                COLOR_SCHEMES.find(s => s.id === previewSchemeId)!
              )}
              className="w-full h-full"
              title="Full size preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};
