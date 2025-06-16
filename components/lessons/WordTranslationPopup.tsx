"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Calculate optimal position
    const calculatePosition = () => {
      const popupWidth = 200; // max-width
      const popupHeight = 60; // estimated height
      const offset = 10;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate horizontal center position
      let left = wordRect.left + (wordRect.width / 2) - (popupWidth / 2);
      
      // Ensure popup stays within horizontal viewport bounds
      if (left < 8) {
        left = 8; // 8px margin from left edge
      } else if (left + popupWidth > viewportWidth - 8) {
        left = viewportWidth - popupWidth - 8; // 8px margin from right edge
      }
      
      // Calculate vertical position (prefer above the word)
      let top = wordRect.top - popupHeight - offset;
      
      // If not enough space above, position below the word
      if (top < 8) {
        top = wordRect.bottom + offset;
      }
      
      // Ensure popup doesn't go below viewport
      if (top + popupHeight > viewportHeight - 8) {
        top = viewportHeight - popupHeight - 8;
      }
      
      setPosition({ top, left });
    };

    calculatePosition();
    
    // Add resize listener to recalculate position if viewport changes
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [wordRect]);

  return (
    <div
      className={`fixed z-50 max-w-[200px] px-3 py-2 bg-black/80 text-white text-sm rounded-lg shadow-lg transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-cyan-300 truncate">
            {word}
          </div>
          <div className="text-white/90 break-words leading-tight">
            {translation}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-0.5 hover:bg-white/20 rounded transition-colors duration-150"
          aria-label="Close translation"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Small arrow pointing to the word */}
      <div 
        className="absolute w-2 h-2 bg-black/80 rotate-45"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          [position.top < wordRect.top ? 'bottom' : 'top']: '-4px'
        }}
      />
    </div>
  );
}