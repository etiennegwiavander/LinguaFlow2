'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabularyCard } from './VocabularyCard';
import { VocabularyNavigationControls } from './VocabularyNavigationControls';
import { VocabularyCardData } from '@/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloatingTranslationToggle from '@/components/lessons/FloatingTranslationToggle';
import { useSidebar } from '@/lib/sidebar-context';
import './vocabulary-accessibility.css';

interface VocabularyFlashcardInterfaceProps {
  vocabularyWords: VocabularyCardData[];
  initialIndex?: number;
  onClose: () => void;
  onPositionChange?: (position: number) => void;
  isLoading?: boolean;
  className?: string;
  studentNativeLanguage?: string | null;
  isTranslating?: boolean;
  onTranslationRequest?: () => void;
}

export const VocabularyFlashcardInterface = React.memo(function VocabularyFlashcardInterface({
  vocabularyWords,
  initialIndex = 0,
  onClose,
  onPositionChange,
  isLoading = false,
  className,
  studentNativeLanguage,
  isTranslating,
  onTranslationRequest
}: VocabularyFlashcardInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [isVisible, setIsVisible] = useState(false);
  const interfaceRef = useRef<HTMLDivElement>(null);
  const [prefetchedCards, setPrefetchedCards] = useState<Set<number>>(new Set());
  
  // Get sidebar state for responsive layout
  const { sidebarCollapsed, isMobile } = useSidebar();

  // Initialize visibility for smooth entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (interfaceRef.current && isVisible) {
      interfaceRef.current.focus();
    }
  }, [isVisible]);

  // Notify parent of position changes and prefetch nearby cards
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(currentIndex);
    }
    
    // Prefetch next few cards for smooth navigation
    const prefetchNext = () => {
      const nextIndices = [currentIndex + 1, currentIndex + 2, currentIndex + 3];
      nextIndices.forEach(index => {
        if (index < vocabularyWords.length && !prefetchedCards.has(index)) {
          // Simulate prefetching by marking as prefetched
          // In a real implementation, this could preload images or other resources
          setPrefetchedCards(prev => new Set(prev).add(index));
        }
      });
    };
    
    // Delay prefetching to avoid blocking current card rendering
    const timer = setTimeout(prefetchNext, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, onPositionChange, vocabularyWords.length, prefetchedCards]);

  // Navigation handlers with animation
  const handleNext = useCallback(() => {
    if (isAnimating || currentIndex >= vocabularyWords.length - 1) return;
    
    setIsAnimating(true);
    setAnimationDirection('forward');
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 150);
  }, [currentIndex, vocabularyWords.length, isAnimating]);

  const handlePrevious = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return;
    
    setIsAnimating(true);
    setAnimationDirection('backward');
    
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setIsAnimating(false);
    }, 150);
  }, [currentIndex, isAnimating]);

  const handleReset = useCallback(() => {
    if (isAnimating || currentIndex === 0) return;
    
    setIsAnimating(true);
    setAnimationDirection('backward');
    
    setTimeout(() => {
      setCurrentIndex(0);
      setIsAnimating(false);
    }, 150);
  }, [currentIndex, isAnimating]);

  // Enhanced close handler with exit animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Enhanced keyboard navigation with comprehensive accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent navigation during animations or loading
      if (isAnimating || isLoading) return;

      // Handle keyboard shortcuts with proper accessibility
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            handlePrevious();
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
          event.preventDefault();
          if (currentIndex < vocabularyWords.length - 1) {
            handleNext();
          }
          break;
        case 'Home':
          event.preventDefault();
          if (currentIndex > 0) {
            handleReset();
          }
          break;
        case 'End':
          event.preventDefault();
          if (currentIndex < vocabularyWords.length - 1) {
            setIsAnimating(true);
            setAnimationDirection('forward');
            setTimeout(() => {
              setCurrentIndex(vocabularyWords.length - 1);
              setIsAnimating(false);
            }, 150);
          }
          break;
        case '?':
          // Show keyboard shortcuts help (announce to screen readers)
          event.preventDefault();
          const helpMessage = `Keyboard shortcuts: Arrow keys or spacebar to navigate, Escape to close, Home to go to first word, End to go to last word.`;
          // Create temporary announcement for screen readers
          const announcement = document.createElement('div');
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('aria-atomic', 'true');
          announcement.className = 'sr-only';
          announcement.textContent = helpMessage;
          document.body.appendChild(announcement);
          setTimeout(() => document.body.removeChild(announcement), 1000);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, handleNext, handlePrevious, handleReset, currentIndex, vocabularyWords.length, isAnimating, isLoading]);

  // Prevent body scroll when interface is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle sidebar state changes for responsive layout
  useEffect(() => {
    // Force a re-render when sidebar state changes to ensure proper positioning
    // This is particularly important for smooth transitions
  }, [sidebarCollapsed, isMobile]);

  // Handle empty vocabulary words
  if (!vocabularyWords || vocabularyWords.length === 0) {
    return (
      <div className={cn(
        'fixed z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out',
        isMobile || sidebarCollapsed 
          ? 'inset-0' 
          : 'top-0 bottom-0 left-64 right-0'
      )}>
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">No vocabulary words available</p>
          <Button onClick={handleClose} variant="outline">
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  const currentWord = vocabularyWords[currentIndex];

  return (
    <div
      ref={interfaceRef}
      className={cn(
        'vocabulary-interface fixed z-50 flex flex-col',
        'bg-background/95 backdrop-blur-md',
        'transition-all duration-300 ease-in-out',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        'supports-[color-scheme]:color-scheme-auto',
        'contrast-more:bg-background contrast-more:border-2 contrast-more:border-foreground',
        // Responsive positioning based on sidebar state
        isMobile || sidebarCollapsed 
          ? 'inset-0' 
          : 'top-0 bottom-0 left-64 right-0',
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95',
        className
      )}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Vocabulary Flashcard Interface"
      aria-describedby="flashcard-description"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Skip links for keyboard navigation */}
      <div className="vocabulary-skip-links">
        <a 
          href="#vocabulary-card-content" 
          className="vocabulary-skip-link vocabulary-focusable"
          onClick={(e) => {
            e.preventDefault();
            const cardElement = document.getElementById('vocabulary-card-content');
            cardElement?.focus();
          }}
        >
          Skip to vocabulary card
        </a>
        <a 
          href="#vocabulary-navigation" 
          className="vocabulary-skip-link vocabulary-focusable"
          onClick={(e) => {
            e.preventDefault();
            const navElement = document.getElementById('vocabulary-navigation');
            navElement?.focus();
          }}
        >
          Skip to navigation controls
        </a>
      </div>
      {/* Background overlay for additional blur effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Header with close button */}
      <div className="relative z-10 flex justify-between items-center py-4 sm:p-6 md:p-8">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            Vocabulary Flashcards
          </h1>
          <div className="text-sm text-muted-foreground">
            ({vocabularyWords.length} words)
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            'hover:bg-destructive/10 transition-colors',
            'p-2 rounded-full',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'contrast-more:border-2 contrast-more:border-current'
          )}
          aria-label="Close vocabulary flashcards and return to profile (Press Escape key)"
          aria-keyshortcuts="Escape"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Main content area with proper responsive layout */}
      <div className="relative z-10 flex-1 flex flex-col py-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-4 min-h-0">
        {/* Vocabulary card container with scroll capability */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0">
            {currentWord && (
              <VocabularyCard
                vocabularyData={currentWord}
                currentIndex={currentIndex}
                studentNativeLanguage={studentNativeLanguage}
                totalWords={vocabularyWords.length}
                isAnimating={isAnimating}
                direction={animationDirection}
                isLoading={isLoading}
                className={cn(
                  'transition-all duration-300 ease-in-out flex-1 min-h-0',
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                )}
              />
            )}
          </div>
        </div>

        {/* Fixed navigation controls at bottom */}
        <div className="flex-shrink-0 mt-4 sm:mt-6 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 pt-4" id="vocabulary-navigation">
          <VocabularyNavigationControls
            currentIndex={currentIndex}
            totalWords={vocabularyWords.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onClose={handleClose}
            onReset={handleReset}
            isAnimating={isAnimating}
            isLoading={isLoading}
            className={cn(
              'vocabulary-navigation transition-all duration-300 ease-in-out delay-100',
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          />
        </div>
      </div>

      {/* Enhanced screen reader announcements and accessibility information */}
      <div className="sr-only">
        <div id="flashcard-description">
          Interactive vocabulary flashcard interface for learning vocabulary words. 
          Navigate through {vocabularyWords.length} vocabulary words using arrow keys, spacebar, or navigation buttons. 
          Press Escape to close and return to the student profile. Press question mark for keyboard shortcuts help.
          Use Home key to go to first word, End key to go to last word.
        </div>
        <div aria-live="polite" aria-atomic="true" id="current-word-announcement">
          {!isAnimating && currentWord && (
            `Displaying vocabulary word ${currentIndex + 1} of ${vocabularyWords.length}: ${currentWord.word}. 
             Part of speech: ${currentWord.partOfSpeech}. Definition: ${currentWord.definition}`
          )}
        </div>
        <div aria-live="assertive" aria-atomic="true" id="navigation-status">
          {isAnimating && `Navigating to ${animationDirection === 'forward' ? 'next' : 'previous'} word...`}
          {isLoading && 'Loading vocabulary content...'}
        </div>
        <div id="keyboard-shortcuts-help" aria-hidden="true">
          Keyboard shortcuts: Arrow keys or spacebar to navigate between words, 
          Escape to close interface, Home to go to first word, End to go to last word, 
          Question mark to repeat this help message.
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3 bg-background/90 rounded-lg px-6 py-4 shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Loading vocabulary...</span>
          </div>
        </div>
      )}

      {/* Decorative elements for visual appeal */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/10 rounded-full animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-primary/20 rounded-full animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-primary/5 rounded-full animate-pulse delay-500" />

      {/* Floating Translation Toggle */}
      {studentNativeLanguage && onTranslationRequest && (
        <FloatingTranslationToggle
          isTranslating={isTranslating || false}
          onToggle={onTranslationRequest}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.vocabularyWords === nextProps.vocabularyWords &&
    prevProps.initialIndex === nextProps.initialIndex &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onPositionChange === nextProps.onPositionChange
  );
});