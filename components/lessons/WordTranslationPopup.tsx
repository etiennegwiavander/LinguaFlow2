"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
  FloatingPortal,
} from "@floating-ui/react";

interface WordTranslationPopupProps {
  word: string;
  translation: string;
  wordRect: DOMRect;
  onClose: () => void;
}

export default function WordTranslationPopup({
  word,
  translation,
  wordRect,
  onClose
}: WordTranslationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);

  // Create a virtual reference element from the word's DOMRect
  const virtualReference = {
    getBoundingClientRect: () => wordRect,
  };

  const {
    refs,
    floatingStyles,
    context,
    placement,
    middlewareData,
  } = useFloating({
    elements: {
      reference: virtualReference,
    },
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8), // 8px gap between word and popup
      flip({
        fallbackPlacements: ["bottom", "top", "left", "right"],
      }),
      shift({
        padding: 8, // 8px from viewport edges
      }),
      arrow({
        element: arrowRef,
        padding: 8,
      }),
    ],
  });

  // Trigger fade-in animation after mounting
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (refs.floating.current && !refs.floating.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, refs.floating]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={`z-50 max-w-[280px] px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl border border-gray-700 transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-cyan-300 truncate mb-1">
              {word}
            </div>
            <div className="text-gray-100 break-words leading-relaxed">
              {translation}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-gray-700 rounded transition-colors duration-150 ml-2"
            aria-label="Close translation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Arrow pointing to the word */}
        <FloatingArrow
          ref={arrowRef}
          context={context}
          className="fill-gray-900"
          width={12}
          height={6}
        />
      </div>
    </FloatingPortal>
  );
}