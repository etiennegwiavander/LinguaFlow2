'use client';

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { InlineLoading } from './LoadingStates';

interface VocabularyNavigationControlsProps {
  currentIndex: number;
  totalWords: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onReset?: () => void;
  isAnimating?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const VocabularyNavigationControls = React.memo(function VocabularyNavigationControls({
  currentIndex,
  totalWords,
  onPrevious,
  onNext,
  onClose,
  onReset,
  isAnimating = false,
  isLoading = false,
  className
}: VocabularyNavigationControlsProps) {
  const isFirstWord = currentIndex === 0;
  const isLastWord = currentIndex === totalWords - 1;

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent navigation during animations or loading
    if (isAnimating || isLoading) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (!isFirstWord) {
          onPrevious();
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ': // Spacebar
        event.preventDefault();
        if (!isLastWord) {
          onNext();
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'Home':
        event.preventDefault();
        if (onReset && currentIndex > 0) {
          onReset();
        }
        break;
    }
  }, [currentIndex, isFirstWord, isLastWord, onPrevious, onNext, onClose, onReset, isAnimating, isLoading]);

  // Set up keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className={cn('flex flex-row items-center justify-between w-full max-w-2xl mx-auto gap-2 sm:gap-0', className)}>
      {/* Mobile & Desktop: Previous button */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={isFirstWord || isAnimating || isLoading}
          className={cn(
            'vocabulary-button vocabulary-navigation-button transition-all duration-200 hover:scale-105 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm',
            'contrast-more:border-2 contrast-more:border-foreground',
            isFirstWord
              ? 'opacity-50 cursor-not-allowed contrast-more:opacity-30'
              : 'hover:bg-primary/10 hover:border-primary/50'
          )}
          aria-label={`Previous vocabulary word. ${isFirstWord ? 'Disabled - at first word' : `Go to word ${currentIndex}`}`}
          aria-describedby="prev-word-help"
          aria-keyshortcuts="ArrowLeft ArrowUp"
        >
          {isAnimating || isLoading ? (
            <InlineLoading size="sm" />
          ) : (
            <>
              <ChevronLeft className="w-3 h-3 sm:w-5 sm:h-5 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </>
          )}
        </Button>

        {/* Reset button (optional) */}
        {onReset && currentIndex > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isAnimating || isLoading}
            className={cn(
              'text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-2',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'contrast-more:border-2 contrast-more:border-current'
            )}
            aria-label="Reset to first vocabulary word (Home key)"
            title="Reset to first word"
            aria-describedby="reset-word-help"
            aria-keyshortcuts="Home"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Mobile & Desktop: Progress indicator */}
      <div className="flex items-center justify-center flex-1 px-2">
        <div className="flex items-center space-x-2">
          {/* Progress text */}
          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
            {currentIndex + 1} of {totalWords}
          </div>
          
          {/* Progress bar with enhanced accessibility */}
          <div className="flex-1 max-w-32 sm:max-w-48">
            <div className={cn(
              'vocabulary-progress w-full bg-muted rounded-full h-1.5 sm:h-2',
              'contrast-more:bg-muted-foreground/30 contrast-more:border contrast-more:border-foreground'
            )}>
              <div 
                className={cn(
                  'vocabulary-progress-fill bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out',
                  'contrast-more:bg-foreground'
                )}
                style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
                role="progressbar"
                aria-valuenow={currentIndex + 1}
                aria-valuemin={1}
                aria-valuemax={totalWords}
                aria-label={`Vocabulary progress: ${currentIndex + 1} of ${totalWords} words completed`}
                aria-describedby="progress-description"
              />
            </div>
            <div id="progress-description" className="sr-only">
              Progress indicator showing current position in vocabulary session
            </div>
          </div>

          {/* Dot indicators for smaller sessions */}
          {totalWords <= 10 && (
            <div className="flex space-x-1" role="tablist" aria-label="Vocabulary word progress">
              {Array.from({ length: totalWords }, (_, index) => {
                const isActive = index === currentIndex;
                const isPassed = index < currentIndex;

                return (
                  <button
                    key={`word-dot-${index}`}
                    className={cn(
                      'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      'contrast-more:border contrast-more:border-foreground',
                      isActive
                        ? 'bg-primary scale-125 shadow-lg contrast-more:bg-foreground'
                        : isPassed
                          ? 'bg-primary/60 hover:bg-primary/80 contrast-more:bg-foreground/60'
                          : 'bg-muted hover:bg-muted-foreground/30 contrast-more:bg-muted-foreground/30'
                    )}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Vocabulary word ${index + 1}${isActive ? ' (current)' : isPassed ? ' (completed)' : ' (upcoming)'}`}
                    tabIndex={isActive ? 0 : -1}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile & Desktop: Next button */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={isLastWord || isAnimating || isLoading}
          className={cn(
            'vocabulary-button vocabulary-navigation-button transition-all duration-200 hover:scale-105 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm',
            'contrast-more:border-2 contrast-more:border-foreground',
            isLastWord
              ? 'opacity-50 cursor-not-allowed contrast-more:opacity-30'
              : 'hover:bg-primary/10 hover:border-primary/50'
          )}
          aria-label={`Next vocabulary word. ${isLastWord ? 'Disabled - at last word' : `Go to word ${currentIndex + 2}`}`}
          aria-describedby="next-word-help"
          aria-keyshortcuts="ArrowRight ArrowDown Space"
        >
          {isAnimating || isLoading ? (
            <InlineLoading size="sm" />
          ) : (
            <>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5 sm:ml-2" aria-hidden="true" />
            </>
          )}
        </Button>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isAnimating || isLoading}
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors p-1 sm:p-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'contrast-more:border-2 contrast-more:border-current'
          )}
          aria-label="Close vocabulary flashcards and return to profile (Escape key)"
          aria-describedby="close-vocab-help"
          aria-keyshortcuts="Escape"
        >
          <X className="w-3 h-3 sm:w-5 sm:h-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Enhanced keyboard shortcuts and status announcements */}
      <div className="sr-only">
        <div aria-live="polite" aria-atomic="true" id="navigation-status">
          {!isAnimating && !isLoading && (
            `Vocabulary navigation controls. Current word ${currentIndex + 1} of ${totalWords}. 
             Use arrow keys to navigate, spacebar for next, escape to close, home to reset to first, end to go to last.
             ${isFirstWord ? 'At first word - previous navigation disabled.' : ''} 
             ${isLastWord ? 'At last word - next navigation disabled.' : ''}`
          )}
        </div>
        <div aria-live="assertive" aria-atomic="true" id="navigation-actions">
          {isAnimating && 'Navigating between vocabulary words...'}
          {isLoading && 'Loading navigation controls...'}
        </div>
      </div>

      {/* Enhanced help text for screen readers */}
      <div className="sr-only">
        <div id="prev-word-help">
          Navigate to the previous vocabulary word. Use left arrow key, up arrow key, or click this button. 
          {isFirstWord && 'This button is disabled because you are at the first word.'}
        </div>
        <div id="next-word-help">
          Navigate to the next vocabulary word. Use right arrow key, down arrow key, spacebar, or click this button.
          {isLastWord && 'This button is disabled because you are at the last word.'}
        </div>
        <div id="reset-word-help">
          Return to the first vocabulary word in this session. Use Home key or click this button.
          This will reset your position to the beginning of the current session.
        </div>
        <div id="close-vocab-help">
          Close the vocabulary flashcard interface and return to student profile. Use Escape key or click this button.
          Your progress will be automatically saved.
        </div>
        <div id="keyboard-shortcuts-summary">
          Available keyboard shortcuts: Arrow keys for navigation, Spacebar for next word, 
          Home key to go to first word, End key to go to last word, Escape key to close interface.
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.totalWords === nextProps.totalWords &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className &&
    prevProps.onPrevious === nextProps.onPrevious &&
    prevProps.onNext === nextProps.onNext &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onReset === nextProps.onReset
  );
});