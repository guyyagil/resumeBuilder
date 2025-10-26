import React from "react";

const A4 = { w: 794, h: 1123 }; // ~A4 @ 96dpi

export function A4Preview({ html }: { html: string }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      // Scale based on width to fit the container
      const s = el.clientWidth / A4.w;
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full rounded-xl bg-white ring-1 ring-gray-200 shadow-sm"
      style={{
        // Let height be determined by scaled content, not aspect ratio
        height: `${A4.h * scale}px`,
      }}
    >
      <iframe
        title="resume thumbnail"
        srcDoc={html}
        className="absolute top-0 left-0 border-0 pointer-events-none"
        style={{
          width: `${A4.w}px`,
          height: `${A4.h}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        loading="lazy"
        sandbox=""
      />
      {/* subtle hover sheen like Canva */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/10 via-transparent to-transparent" />
    </div>
  );
}
