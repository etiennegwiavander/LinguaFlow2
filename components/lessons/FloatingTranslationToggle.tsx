"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingTranslationToggleProps {
  isTranslating: boolean;
  onToggle: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: { x: number; y: number };
}

export default function FloatingTranslationToggle({
  isTranslating,
  onToggle,
  className = '',
  position = 'bottom-right',
  offset = { x: 20, y: 40 }
}: FloatingTranslationToggleProps) {
  
  // Check if we're in the browser (not SSR)
  if (typeof window === 'undefined') {
    return null;
  }

  // Simple toast-like positioning - always floating at bottom right of viewport
  const floatingButton = (
    <div 
      className={className}
      style={{
        position: 'fixed',
        bottom: '40px', // Always 40px from bottom of screen
        right: '20px',  // Always 20px from right of screen
        zIndex: 9999,   // Highest z-index to stay on top
        pointerEvents: 'auto', // Ensure it's clickable
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="flex items-center justify-center space-x-2 border-cyber-400/50 hover:bg-cyber-400/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-4 py-2 ring-2 ring-cyber-400/20 hover:ring-cyber-400/40 hover:scale-105 font-medium"
        onClick={onToggle}
        disabled={isTranslating}
        title="Double-click any text in the lesson to translate it"
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyber-500" />
        ) : (
          <Globe className="w-4 h-4 text-cyber-600 dark:text-cyber-400" />
        )}
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Translate
        </span>
      </Button>
    </div>
  );

  // Use portal to render directly to document.body, ensuring it's truly floating
  return createPortal(floatingButton, document.body);
}