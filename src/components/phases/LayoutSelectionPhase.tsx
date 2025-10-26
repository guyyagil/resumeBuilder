import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useAppStore } from '../../store';
import { LAYOUT_STRUCTURES } from '../../phaseUtils/design/templates/layouts';
import { generateLayoutPreview } from '../../phaseUtils/design/templates/layoutPreviewGenerator';
import { TemplateCard } from '../ui/TemplateCard';

const A4 = { w: 794, h: 1123 }; // ~210mm x 297mm in CSS pixels @96dpi

function ScaledModalPreview({ html }: { html: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
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

export const LayoutSelectionPhase: React.FC = () => {
  const { setSelectedLayout } = useAppStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewLayout, setPreviewLayout] = useState<string | null>(null);

  const previews = useMemo(() => {
    const map = new Map<string, string>();
    LAYOUT_STRUCTURES.forEach((layout) => {
      map.set(layout.type, generateLayoutPreview(layout));
    });
    return map;
  }, []);

  const handleSelectLayout = (layoutType: string) => {
    setSelectedType(layoutType);
    const layout = LAYOUT_STRUCTURES.find((l) => l.type === layoutType);
    if (layout) setSelectedLayout(layout);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Choose Your Resume Layout
        </h1>
        <p className="text-gray-600 text-lg">Select a layout structure that best showcases your content</p>
        <p className="text-sm text-blue-600 font-medium mt-2">You'll choose colors in the next step</p>
      </div>

      {/* Canva-style Gallery Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-[1800px] mx-auto">
          {LAYOUT_STRUCTURES.map((layout) => {
            const isSelected = selectedType === layout.type;
            const html = previews.get(layout.type) ?? '';
            // Use first sentence of description as subtitle
            const subtitle = layout.description.split('.')[0] + '.';

            return (
              <TemplateCard
                key={layout.type}
                html={html}
                title={layout.name}
                subtitle={subtitle}
                selected={isSelected}
                onClick={() => handleSelectLayout(layout.type)}
                onPreview={() => setPreviewLayout(layout.type)}
              />
            );
          })}
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {previewLayout && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={() => setPreviewLayout(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewLayout(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <ScaledModalPreview html={previews.get(previewLayout) ?? ''} />
          </div>
        </div>
      )}
    </div>
  );
};
