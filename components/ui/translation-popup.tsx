"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranslationPopupProps {
  isVisible: boolean;
  position: { x: number; y: number };
  originalText: string;
  translatedText: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function TranslationPopup({
  isVisible,
  position,
  originalText,
  translatedText,
  isLoading,
  onClose
}: TranslationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isVisible && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position if popup would overflow
      if (position.x + rect.width > viewportWidth - 20) {
        newX = viewportWidth - rect.width - 20;
      }
      if (newX < 20) {
        newX = 20;
      }

      // Adjust vertical position if popup would overflow
      if (position.y - rect.height < 20) {
        newY = position.y + 40; // Show below the word instead
      } else {
        newY = position.y - rect.height - 10; // Show above the word
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isVisible, position, translatedText]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Translation popup */}
      <div
        ref={popupRef}
        className={cn(
          "fixed z-50 max-w-xs min-w-[200px] transform transition-all duration-300 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        <div className="relative">
          {/* Arrow pointing to the word */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rotate-45 shadow-lg"></div>
          </div>
          
          {/* Main popup content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyber-50 to-neon-50 dark:from-cyber-900/20 dark:to-neon-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyber-600 dark:text-cyber-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Translation
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Original text */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Original
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-md">
                  "{originalText}"
                </p>
              </div>

              {/* Translation */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Translation
                </p>
                {isLoading ? (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <Loader2 className="w-4 h-4 animate-spin text-cyber-600 dark:text-cyber-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Translating...
                    </span>
                  </div>
                ) : translatedText ? (
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
                    "{translatedText}"
                  </p>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">
                    Translation failed
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Tap anywhere to close
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}