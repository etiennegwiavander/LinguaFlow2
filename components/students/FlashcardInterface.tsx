'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '@/types';
import { QuestionCard } from './QuestionCard';
import { NavigationControls } from './NavigationControls';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { QuestionLoadErrorFallback } from './ErrorFallbacks';
import { FlashcardSkeleton } from './SkeletonLoaders';
import FloatingTranslationToggle from '@/components/lessons/FloatingTranslationToggle';

interface FlashcardInterfaceProps {
  questions: Question[];
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  studentNativeLanguage?: string | null;
  isTranslating?: boolean;
  onTranslationRequest?: () => void;
}

export const FlashcardInterface = React.memo(function FlashcardInterface({
  questions,
  isOpen,
  onClose,
  topicTitle,
  studentNativeLanguage,
  isTranslating,
  onTranslationRequest
}: FlashcardInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isLoading, setIsLoading] = useState(false);

  // Touch gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Reset to first question when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setIsAnimating(false);
      setDirection('forward');
      setIsLoading(questions.length === 0);
    }
  }, [isOpen, questions.length]);

  // Enhanced keyboard navigation for accessibility - defined after other handlers

  // Handle click outside to close
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Navigation functions with animation
  const navigateToQuestion = useCallback((newIndex: number, navDirection: 'forward' | 'backward') => {
    if (isAnimating || newIndex < 0 || newIndex >= questions.length) {
      return;
    }

    setIsAnimating(true);
    setDirection(navDirection);

    // Animation timing
    setTimeout(() => {
      setCurrentQuestionIndex(newIndex);
      setIsAnimating(false);
    }, 150);
  }, [isAnimating, questions.length]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1, 'forward');
    }
  }, [currentQuestionIndex, questions.length, navigateToQuestion]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1, 'backward');
    }
  }, [currentQuestionIndex, navigateToQuestion]);

  const handleReset = useCallback(() => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(0, 'backward');
    }
  }, [currentQuestionIndex, navigateToQuestion]);

  // Enhanced keyboard navigation for accessibility
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || isAnimating) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (currentQuestionIndex > 0) {
          handlePrevious();
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ': // Spacebar
        event.preventDefault();
        if (currentQuestionIndex < questions.length - 1) {
          handleNext();
        }
        break;
      case 'Home':
        event.preventDefault();
        if (currentQuestionIndex > 0) {
          handleReset();
        }
        break;
      case 'End':
        event.preventDefault();
        if (currentQuestionIndex < questions.length - 1) {
          navigateToQuestion(questions.length - 1, 'forward');
        }
        break;
    }
  }, [isOpen, isAnimating, currentQuestionIndex, questions.length, handlePrevious, handleNext, onClose, handleReset, navigateToQuestion]);

  // Set up keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Touch gesture handl
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentQuestionIndex < questions.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentQuestionIndex > 0) {
      handlePrevious();
    }
  }, [touchStart, touchEnd, currentQuestionIndex, questions.length, handleNext, handlePrevious]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Show error fallback if no questions available
  if (questions.length === 0) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-background/80 backdrop-blur-md'
        )}
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <QuestionLoadErrorFallback
            topicTitle={topicTitle}
            questionCount={0}
            onRetry={onClose}
          />
        </div>
      </div>
    );
  }

  // Show loading state if questions are being loaded
  if (isLoading) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-background/80 backdrop-blur-md'
        )}
      >
        <FlashcardSkeleton />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ErrorBoundary
      fallback={
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            'bg-background/80 backdrop-blur-md'
          )}
          onClick={onClose}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <QuestionLoadErrorFallback
              topicTitle={topicTitle}
              onRetry={onClose}
            />
          </div>
        </div>
      }
    >
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'p-2 sm:p-4 md:p-6 lg:p-8',
          'bg-background/80 backdrop-blur-md',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcard-title"
        aria-describedby="flashcard-description"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Main flashcard container */}
        <div
          className={cn(
            'relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto',
            'transform transition-all duration-300 ease-out',
            'flex flex-col h-full md:h-fit max-h-screen overflow-hidden',
            'justify-between py-4 sm:py-6 md:py-8',
            isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with topic title */}

          <div className="flex-shrink-0 px-4 py-2 sm:py-4">
            <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-3 shadow-lg max-w-md mx-auto">
              <h1
                id="flashcard-title"
                className="text-lg sm:text-xl md:text-2xl font-bold text-foreground text-center mb-2"
              >
                {topicTitle}
              </h1>
              <p
                id="flashcard-description"
                className="text-xs sm:text-sm text-muted-foreground text-center"
              >
                <span className="hidden sm:inline">Discussion Questions - Navigate with arrow keys or buttons</span>
                <span className="sm:hidden">Swipe or tap to navigate</span>
              </p>
            </div>
          </div>

          {/* Question card */}
          <div
            className="flex-1 flex items-center justify-center px-4 py-2 md:mt-28 min-h-0"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentQuestionIndex}
              studentNativeLanguage={studentNativeLanguage}
              totalQuestions={questions.length}
              isAnimating={isAnimating}
              direction={direction}
              className="shadow-lg sm:shadow-xl md:shadow-2xl w-full h-full"
            />
          </div>

          {/* Navigation controls */}
          <div className="flex-shrink-0 px-4 py-2 sm:py-4 md:mb-2" id="flashcard-navigation">
            <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-3 shadow-lg max-w-md mx-auto">
              <NavigationControls
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onClose={onClose}
                onReset={handleReset}
                isAnimating={isAnimating}
                className="w-full"
              />
            </div>
          </div>

          {/* Accessibility announcements */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isOpen && !isAnimating && (
              `Flashcard mode active. Topic: ${topicTitle}. 
             Question ${currentQuestionIndex + 1} of ${questions.length}. 
             Use arrow keys to navigate, spacebar for next, escape to close, home to reset, end to go to last question.`
            )}
          </div>

          {/* Skip link for keyboard users */}
          <a
            href="#flashcard-navigation"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
          >
            Skip to navigation controls
          </a>
        </div>

        {/* Background blur overlay */}
        <div
          className="absolute inset-0 -z-10 bg-black/20"
          aria-hidden="true"
        />

        {/* Floating Translation Toggle */}
        {studentNativeLanguage && onTranslationRequest && (
          <FloatingTranslationToggle
            isTranslating={isTranslating || false}
            onToggle={onTranslationRequest}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.topicTitle === nextProps.topicTitle &&
    prevProps.questions.length === nextProps.questions.length &&
    prevProps.questions.every((q, i) => q.id === nextProps.questions[i]?.id) &&
    prevProps.onClose === nextProps.onClose
  );
});