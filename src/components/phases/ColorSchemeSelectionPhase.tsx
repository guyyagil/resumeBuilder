import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { COLOR_SCHEMES } from '../../phaseUtils/design/templates/colorSchemes';
import { generateLayoutPreview } from '../../phaseUtils/design/templates/layoutPreviewGenerator';
import { TemplateCard } from '../ui/TemplateCard';

const A4 = { w: 794, h: 1123 }; // ~210mm x 297mm in CSS pixels @96dpi

function ScaledModalPreview({ html }: { html: string }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const s = Math.min(cw / A4.w, ch / A4.h);
      setScale(Math.max(0.1, s));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="w-full h-full relative overflow-auto">
      <div className="absolute inset-0 flex items-center justify-center">
        <iframe
          title="full preview"
          srcDoc={html}
          className="border-0"
          style={{
            width: `${A4.w}px`,
            height: `${A4.h}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          sandbox=""
        />
      </div>
    </div>
  );
}

export const ColorSchemeSelectionPhase: React.FC = () => {
  const { selectedLayout, setSelectedColorScheme } = useAppStore();
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [previewSchemeId, setPreviewSchemeId] = useState<string | null>(null);

  // Generate all colored previews using useMemo to cache them
  const previews = useMemo(() => {
    if (!selectedLayout) return new Map<string, string>();
    const map = new Map<string, string>();
    COLOR_SCHEMES.forEach((scheme) => {
      map.set(scheme.id, generateLayoutPreview(selectedLayout, scheme));
    });
    return map;
  }, [selectedLayout]);

  const handleSelectScheme = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    if (scheme) {
      setSelectedColorScheme(scheme);
    }
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Choose Your Color Scheme
        </h1>
        <p className="text-gray-600 text-lg">Select colors that match your style and industry</p>
        <p className="text-sm text-blue-600 font-medium mt-2">
          Layout: <span className="font-bold">{selectedLayout.name}</span>
        </p>
      </div>

      {/* Canva-style Gallery Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-[1800px] mx-auto">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedSchemeId === scheme.id;
            const html = previews.get(scheme.id) ?? '';

            return (
              <TemplateCard
                key={scheme.id}
                html={html}
                title={scheme.name}
                subtitle={`${scheme.colors.primary} • ${scheme.colors.accent}`}
                selected={isSelected}
                onClick={() => handleSelectScheme(scheme.id)}
                onPreview={() => setPreviewSchemeId(scheme.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {previewSchemeId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={() => setPreviewSchemeId(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewSchemeId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <ScaledModalPreview html={previews.get(previewSchemeId) ?? ''} />
          </div>
        </div>
      )}
    </div>
  );
};