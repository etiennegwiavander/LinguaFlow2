'use client';

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { InlineLoading } from './LoadingStates';

interface NavigationControlsProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onReset?: () => void;
  isAnimating?: boolean;
  className?: string;
}

export const NavigationControls = React.memo(function NavigationControls({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onClose,
  onReset,
  isAnimating = false,
  className
}: NavigationControlsProps) {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent navigation during animations
    if (isAnimating) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (!isFirstQuestion) {
          onPrevious();
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ': // Spacebar
        event.preventDefault();
        if (!isLastQuestion) {
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
  }, [currentIndex, isFirstQuestion, isLastQuestion, onPrevious, onNext, onClose, onReset, isAnimating]);

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
          disabled={isFirstQuestion || isAnimating}
          className={cn(
            'transition-all duration-200 hover:scale-105 active:scale-95',
            'focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm',
            isFirstQuestion
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-primary/10 hover:border-primary/50'
          )}
          aria-label={`Previous question. ${isFirstQuestion ? 'Disabled - at first question' : `Go to question ${currentIndex}`}`}
          aria-describedby="prev-button-help"
        >
          {isAnimating ? (
            <InlineLoading size="sm" />
          ) : (
            <>
              <ChevronLeft className="w-3 h-3 sm:w-5 sm:h-5 sm:mr-2" />
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
            disabled={isAnimating}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-2"
            aria-label="Reset to first question (Home key)"
            title="Reset to first question"
            aria-describedby="reset-button-help"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        )}
      </div>

      {/* Mobile & Desktop: Progress indicator */}
      <div className="flex items-center justify-center flex-1 px-2">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1" role="tablist" aria-label="Question progress">
            {Array.from({ length: Math.min(totalQuestions, 8) }, (_, index) => {
              // Show fewer dots on mobile (responsive via CSS)
              const maxDots = 8;
              let dotIndex = index;
              let showDot = true;

              if (totalQuestions > maxDots) {
                const halfDots = Math.floor(maxDots / 2);
                if (index < 2) {
                  dotIndex = index;
                } else if (index === 2 && currentIndex > halfDots + 1) {
                  return (
                    <span key="ellipsis-start" className="text-muted-foreground text-xs px-1">
                      ...
                    </span>
                  );
                } else if (index >= 3 && index <= maxDots - 3) {
                  dotIndex = currentIndex - halfDots + index - 2;
                  if (dotIndex < 0 || dotIndex >= totalQuestions) {
                    showDot = false;
                  }
                } else if (index === maxDots - 2 && currentIndex < totalQuestions - halfDots) {
                  return (
                    <span key="ellipsis-end" className="text-muted-foreground text-xs px-1">
                      ...
                    </span>
                  );
                } else {
                  dotIndex = totalQuestions - (maxDots - index);
                }
              }

              if (!showDot || dotIndex < 0 || dotIndex >= totalQuestions) {
                return null;
              }

              const isActive = dotIndex === currentIndex;
              const isPassed = dotIndex < currentIndex;

              return (
                <button
                  key={`dot-${index}-${dotIndex}`}
                  className={cn(
                    'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                    isActive
                      ? 'bg-primary scale-125 shadow-lg'
                      : isPassed
                        ? 'bg-primary/60 hover:bg-primary/80'
                        : 'bg-muted hover:bg-muted-foreground/30'
                  )}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Question ${dotIndex + 1}${isActive ? ' (current)' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile & Desktop: Next button */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={isLastQuestion || isAnimating}
          className={cn(
            'transition-all duration-200 hover:scale-105 active:scale-95',
            'focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm',
            isLastQuestion
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-primary/10 hover:border-primary/50'
          )}
          aria-label={`Next question. ${isLastQuestion ? 'Disabled - at last question' : `Go to question ${currentIndex + 2}`}`}
          aria-describedby="next-button-help"
        >
          {isAnimating ? (
            <InlineLoading size="sm" />
          ) : (
            <>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5 sm:ml-2" />
            </>
          )}
        </Button>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isAnimating}
          className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors p-1 sm:p-2"
          aria-label="Close flashcards and return to topics (Escape key)"
          aria-describedby="close-button-help"
        >
          <X className="w-3 h-3 sm:w-5 sm:h-5" />
        </Button>
      </div>



      {/* Keyboard shortcuts hint */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isAnimating && (
          `Navigation controls. Current question ${currentIndex + 1} of ${totalQuestions}. 
           Use arrow keys to navigate, spacebar for next, escape to close, home to reset to first, end to go to last.
           ${isFirstQuestion ? 'At first question.' : ''} 
           ${isLastQuestion ? 'At last question.' : ''}`
        )}
      </div>

      {/* Hidden help text for screen readers */}
      <div className="sr-only">
        <div id="prev-button-help">
          Navigate to the previous discussion question. Use left arrow key or click this button.
        </div>
        <div id="next-button-help">
          Navigate to the next discussion question. Use right arrow key, spacebar, or click this button.
        </div>
        <div id="reset-button-help">
          Return to the first question in this topic. Use Home key or click this button.
        </div>
        <div id="close-button-help">
          Close the flashcard interface and return to topic selection. Use Escape key or click this button.
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.totalQuestions === nextProps.totalQuestions &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.className === nextProps.className &&
    prevProps.onPrevious === nextProps.onPrevious &&
    prevProps.onNext === nextProps.onNext &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onReset === nextProps.onReset
  );
});