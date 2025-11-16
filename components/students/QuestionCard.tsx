'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Question } from '@/types';
import { FlashcardNavigationLoading } from './LoadingStates';
import { useTextTranslation } from '@/hooks/useTextTranslation';
import WordTranslationPopup from '@/components/lessons/WordTranslationPopup';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  isAnimating: boolean;
  direction?: 'forward' | 'backward';
  className?: string;
  isLoading?: boolean;
  studentNativeLanguage?: string | null;
}

export const QuestionCard = React.memo(function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  isAnimating,
  direction = 'forward',
  className,
  isLoading = false,
  studentNativeLanguage
}: QuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  
  // Translation feature
  const { translationPopup, handleTextDoubleClick, closeTranslationPopup } = useTextTranslation(studentNativeLanguage);

  // Focus management for accessibility
  useEffect(() => {
    if (cardRef.current && !isAnimating && !isLoading) {
      cardRef.current.focus();
    }
  }, [currentIndex, isAnimating, isLoading]);

  // Simulate content loading for smooth transitions
  useEffect(() => {
    if (question && !isAnimating) {
      setIsContentLoaded(false);
      const timer = setTimeout(() => {
        setIsContentLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [question, isAnimating]);

  // Animation classes based on direction and state
  const getAnimationClasses = () => {
    if (!isAnimating) {
      return 'translate-x-0 opacity-100 scale-100';
    }
    
    if (direction === 'forward') {
      return 'translate-x-full opacity-0 scale-95';
    } else {
      return '-translate-x-full opacity-0 scale-95';
    }
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto h-full flex flex-col">
      {/* Progress indicator */}
      <div className="mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span className="capitalize text-xs">{question.difficulty_level}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
          <div 
            className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
            aria-label={`Progress: ${currentIndex + 1} of ${totalQuestions} questions`}
          />
        </div>
      </div>

      {/* Main flashcard */}
      <Card
        ref={cardRef}
        className={cn(
          'relative flex-1 min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]',
          'transition-all duration-300 ease-in-out transform',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'hover:shadow-lg cursor-default touch-manipulation',
          'flex flex-col',
          getAnimationClasses(),
          className
        )}
        tabIndex={0}
        role="article"
        aria-label={`Discussion question ${currentIndex + 1} of ${totalQuestions}`}
        aria-describedby={`question-${question.id} question-progress-${currentIndex}`}
      >
        <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 flex items-center justify-center h-full flex-1">
          {isLoading || !isContentLoaded ? (
            <FlashcardNavigationLoading />
          ) : (
            <div className={cn(
              "text-center space-y-2 sm:space-y-3 md:space-y-4 transition-opacity duration-200 w-full",
              isContentLoaded ? "opacity-100" : "opacity-0"
            )}>
              {/* Question text */}
              <h2 
                className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium leading-relaxed text-foreground px-2 select-text cursor-text"
                id={`question-${question.id}`}
                onDoubleClick={studentNativeLanguage ? handleTextDoubleClick : undefined}
                title={studentNativeLanguage ? "Double-click any word to translate" : undefined}
              >
                {question.question_text}
              </h2>
              
              {/* Visual separator */}
              <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-primary/20 rounded-full mx-auto mt-3 sm:mt-4 md:mt-6" />
              
              {/* Accessibility hint */}
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 md:mt-4 px-2" role="note">
                <span className="hidden sm:inline">Use arrow keys, spacebar, or navigation buttons to move between questions. Press Escape to close.</span>
                <span className="sm:hidden">Swipe left or right to navigate, or use the navigation buttons below.</span>
              </p>
            </div>
          )}
        </CardContent>

        {/* Decorative elements for visual appeal */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary/20 rounded-full" />
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-1 sm:w-1 h-1 sm:h-1 bg-primary/10 rounded-full" />
      </Card>

      {/* Screen reader announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {!isAnimating && `Now showing question ${currentIndex + 1} of ${totalQuestions}. Difficulty level: ${question.difficulty_level}. Question: ${question.question_text}`}
      </div>

      {/* Hidden progress description for screen readers */}
      <div className="sr-only" id={`question-progress-${currentIndex}`}>
        Progress: {currentIndex + 1} out of {totalQuestions} questions completed. 
        Current difficulty level: {question.difficulty_level}.
        {currentIndex === 0 && ' This is the first question.'}
        {currentIndex === totalQuestions - 1 && ' This is the last question.'}
      </div>

      {/* Translation Popup */}
      {translationPopup.isVisible && translationPopup.wordRect && (
        <WordTranslationPopup
          word={translationPopup.word}
          translation={translationPopup.translation}
          wordRect={translationPopup.wordRect}
          onClose={closeTranslationPopup}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.totalQuestions === nextProps.totalQuestions &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.direction === nextProps.direction &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className &&
    prevProps.studentNativeLanguage === nextProps.studentNativeLanguage
  );
});