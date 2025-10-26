import React from "react";
import { A4Preview } from "./A4Preview";

export function TemplateCard({
  html,
  title,
  subtitle,
  selected,
  onClick,
  onPreview,
}: {
  html: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
}) {
  return (
    <figure
      onClick={onClick}
      className={`
        group cursor-pointer select-none
        transition-transform
        ${selected ? "scale-[1.01]" : "hover:scale-[1.01]"}
      `}
    >
      {/* Thumbnail */}
      <div className="relative">
        <A4Preview html={html} />

        {/* Quick action on hover */}
        <div className="absolute inset-0 flex items-end justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.();
            }}
            className="px-3 py-1.5 rounded-md bg-white/95 text-gray-900 text-sm font-medium shadow-md hover:bg-white"
          >
            Preview Full Size
          </button>
        </div>

        {/* Selected ring */}
        {selected && (
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-4 ring-blue-400" />
        )}

        {/* Selected badge */}
        {selected && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-xl flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Selected</span>
          </div>
        )}
      </div>

      {/* Caption (outside the card) */}
      <figcaption className="px-1">
        <div className="mt-3 text-[17px] font-semibold text-gray-900 leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{subtitle}</div>
        )}
      </figcaption>
    </figure>
  );
}
