"use client";

import { useLayoutEffect, useState, useRef } from "react";
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
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Log the received wordRect for debugging
    console.log('📍 WordTranslationPopup received wordRect:', {
      top: wordRect.top,
      left: wordRect.left,
      right: wordRect.right,
      bottom: wordRect.bottom,
      width: wordRect.width,
      height: wordRect.height
    });

    // Calculate optimal position using actual popup dimensions
    const calculatePosition = () => {
      if (!popupRef.current) {
        console.log('⚠️ PopupRef not available yet');
        return;
      }
      
      const popupWidth = popupRef.current.offsetWidth;
      const popupHeight = popupRef.current.offsetHeight;
      const offset = 8; // Reduced offset for closer positioning
      
      console.log('📏 Popup dimensions:', { popupWidth, popupHeight });
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      
      console.log('🖥️ Viewport info:', { 
        viewportWidth, 
        viewportHeight, 
        scrollX, 
        scrollY 
      });
      
      // Calculate horizontal center position relative to the word
      let left = wordRect.left + (wordRect.width / 2) - (popupWidth / 2);
      
      // Ensure popup stays within horizontal viewport bounds
      const minLeft = 8;
      const maxLeft = viewportWidth - popupWidth - 8;
      
      if (left < minLeft) {
        left = minLeft;
      } else if (left > maxLeft) {
        left = maxLeft;
      }
      
      // Calculate vertical position (prefer above the word)
      let top = wordRect.top - popupHeight - offset;
      
      // If not enough space above, position below the word
      if (top < 8) {
        top = wordRect.bottom + offset;
        console.log('🔄 Positioning below word due to insufficient space above');
      }
      
      // Ensure popup doesn't go below viewport
      if (top + popupHeight > viewportHeight - 8) {
        top = viewportHeight - popupHeight - 8;
        console.log('🔄 Adjusting position to stay within viewport bottom');
      }
      
      console.log('🎯 Final calculated position:', { top, left });
      
      setPosition({ top, left });
    };

    // Force a reflow to ensure popup is rendered before measuring
    if (popupRef.current) {
      popupRef.current.offsetHeight; // Force reflow
    }
    
    // Calculate position immediately
    calculatePosition();
    
    // Add resize and scroll listeners to recalculate position
    const handleResize = () => {
      console.log('🔄 Window resized, recalculating position');
      calculatePosition();
    };
    
    const handleScroll = () => {
      console.log('🔄 Window scrolled, recalculating position');
      calculatePosition();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    // Trigger fade-in animation after position is calculated
    const timer = setTimeout(() => {
      console.log('✨ Making popup visible');
      setIsVisible(true);
    }, 10);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [wordRect, word, translation]); // Recalculate when content or wordRect changes

  // Stop propagation on popup click to prevent it from closing when clicking inside
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={popupRef}
      className={`fixed z-50 max-w-[280px] px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg shadow-xl border border-gray-700 transition-all duration-200 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: 'auto'
      }}
      onClick={handlePopupClick}
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
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors duration-150 ml-2"
          aria-label="Close translation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Arrow pointing to the word */}
      <div 
        className="absolute w-3 h-3 bg-gray-900/95 border-l border-t border-gray-700 rotate-45"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          [position.top < wordRect.top ? 'bottom' : 'top']: '-6px'
        }}
      />
    </div>
  );
}