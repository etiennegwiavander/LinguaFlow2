'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VocabularyCardData } from '@/types';
import { vocabularyPerformanceMonitor } from '@/lib/vocabulary-performance-monitor';

interface VocabularyCardProps {
  vocabularyData: VocabularyCardData;
  currentIndex: number;
  totalWords: number;
  isAnimating: boolean;
  direction?: 'forward' | 'backward';
  className?: string;
  isLoading?: boolean;
}

export const VocabularyCard = React.memo(function VocabularyCard({
  vocabularyData,
  currentIndex,
  totalWords,
  isAnimating,
  direction = 'forward',
  className,
  isLoading = false
}: VocabularyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [isExamplesExpanded, setIsExamplesExpanded] = useState(false);
  const [areExamplesLoaded, setAreExamplesLoaded] = useState(false);

  // Focus management for accessibility
  useEffect(() => {
    if (cardRef.current && !isAnimating && !isLoading) {
      cardRef.current.focus();
    }
  }, [currentIndex, isAnimating, isLoading]);

  // Performance monitoring for card renders
  useEffect(() => {
    // Only track in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_PERF_MONITORING) {
      return;
    }

    const operationId = `card-render-${Date.now()}`;
    vocabularyPerformanceMonitor.startTiming(operationId);

    // Use requestAnimationFrame to measure actual render completion
    const rafId = requestAnimationFrame(() => {
      vocabularyPerformanceMonitor.endTiming(operationId);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [vocabularyData.word]);

  // Reset expansion state when card changes (mobile only, desktop always shows)
  useEffect(() => {
    setIsExamplesExpanded(false);
    setAreExamplesLoaded(false);
  }, [vocabularyData.word]);

  // Auto-load examples immediately (for desktop view)
  useEffect(() => {
    if (vocabularyData && !isAnimating) {
      const timer = setTimeout(() => {
        setAreExamplesLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vocabularyData, isAnimating]);

  // Simulate content loading for smooth transitions
  useEffect(() => {
    if (vocabularyData && !isAnimating) {
      setIsContentLoaded(false);
      const timer = setTimeout(() => {
        setIsContentLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vocabularyData, isAnimating]);

  // Lazy load examples when expanded (mobile only)
  useEffect(() => {
    if (isExamplesExpanded && !areExamplesLoaded) {
      // Simulate lazy loading with a small delay for smooth UX
      const timer = setTimeout(() => {
        setAreExamplesLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [areExamplesLoaded, isExamplesExpanded]);

  // Animation classes based on direction and state - optimized with transform3d for GPU acceleration
  const getAnimationClasses = () => {
    if (!isAnimating) {
      return 'translate3d(0, 0, 0) opacity-100 scale-100';
    }

    if (direction === 'forward') {
      return 'translate3d(100%, 0, 0) opacity-0 scale-95';
    } else {
      return 'translate3d(-100%, 0, 0) opacity-0 scale-95';
    }
  };

  // Helper function to highlight vocabulary word in sentences
  const highlightVocabularyWord = (sentence: string, word: string) => {
    if (!sentence || !word) return sentence;

    const regex = new RegExp(`\\b(${word}|${word}s|${word}ed|${word}ing)\\b`, 'gi');
    return sentence.replace(regex, (match) => `<strong>${match}</strong>`);
  };

  // Pronunciation handler (placeholder for future audio implementation)
  const handlePronunciation = () => {
    // Future implementation: play pronunciation audio
    console.log('Playing pronunciation for:', vocabularyData.word);
  };

  const tenseCategories = [
    { key: 'present', label: 'Present', sentence: vocabularyData.exampleSentences.present },
    { key: 'past', label: 'Past', sentence: vocabularyData.exampleSentences.past },
    { key: 'future', label: 'Future', sentence: vocabularyData.exampleSentences.future },
    { key: 'presentPerfect', label: 'Present Perfect', sentence: vocabularyData.exampleSentences.presentPerfect },
    { key: 'pastPerfect', label: 'Past Perfect', sentence: vocabularyData.exampleSentences.pastPerfect },
    { key: 'futurePerfect', label: 'Future Perfect', sentence: vocabularyData.exampleSentences.futurePerfect },
  ];

  if (isLoading) {
    return (
      <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto h-full flex flex-col">
        <Card className="flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 flex items-center justify-center h-full">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="h-6 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top: Progress bar with Word count and Part of Speech */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium">Word {currentIndex + 1} of {totalWords}</span>
          <span className="capitalize font-medium">{vocabularyData.partOfSpeech}</span>
        </div>
        <div className="w-1/2 bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalWords}
            aria-label={`Progress: ${currentIndex + 1} of ${totalWords} vocabulary words`}
          />
        </div>
      </div>

      {/* Main content area: Two columns on large screens */}
      <div
        ref={cardRef}
        className={cn(
          "flex-1 flex flex-col lg:flex-row lg:gap-2 overflow-hidden transition-opacity duration-200",
          isContentLoaded ? "opacity-100" : "opacity-0",
          getAnimationClasses()
        )}
        tabIndex={0}
        role="article"
        aria-label={`Vocabulary word ${currentIndex + 1} of ${totalWords}: ${vocabularyData.word}`}
      >
        {/* Left Column: Vocabulary Section */}
        <div className="flex-1 lg:w-1/3 flex flex-col justify-center items-center p-6 lg:p-8 border border-border rounded-none bg-card mb-4 lg:mb-0">
          <div className="text-center space-y-4 w-full">
            {/* Word with pronunciation button */}
            <div className="flex items-center justify-center gap-3">
              <h1
                className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground"
                id={`vocabulary-word-${currentIndex}`}
              >
                {vocabularyData.word}
              </h1>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={handlePronunciation}
                className="p-2 hover:bg-primary/10 rounded-full"
                aria-label={`Play pronunciation for ${vocabularyData.word}`}
              >
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              </Button> */}
            </div>

            {/* Pronunciation */}
            <div
              className="text-xl lg:text-xl text-muted-foreground font-mono"
              id={`word-pronunciation-${currentIndex}`}
            >
              /{vocabularyData.pronunciation}/
            </div>

            {/* Part of Speech Badge */}
            <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {vocabularyData.partOfSpeech}
            </div>

            {/* Definition */}
            <div className="pt-4">
              <p
                className="text-lg lg:text-xl text-foreground leading-relaxed"
                id={`word-definition-${currentIndex}`}
              >
                {vocabularyData.definition}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Example Sentences Section */}
        <div className="flex-1 lg:w-2/3 flex flex-col p-6 lg:p-4 border border-border rounded-none bg-card overflow-hidden">
          {/* <h2 className="text-base font-semibold text-primary mb-4 uppercase tracking-wide flex-shrink-0">
            Example Sentences
          </h2> */}

          <div className="flex-1 overflow-y-auto pr-2">
            {areExamplesLoaded ? (
              <div className="space-y-4">
                {tenseCategories.map(({ key, label, sentence }) => (
                  sentence && (
                    <div key={key} className="space-y-1.5">
                      <h3 className="text-xs  text-primary  italic tracking-wide">
                        {label}
                      </h3>
                      <p
                        className="text-sm lg:text-base text-foreground leading-relaxed pl-3 border-l-2 border-primary/30"
                        dangerouslySetInnerHTML={{
                          __html: highlightVocabularyWord(sentence, vocabularyData.word)
                        }}
                      />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <div key={index} className="space-y-2 animate-pulse">
                    <div className="h-3 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only">
        <div aria-live="polite" aria-atomic="true">
          {!isAnimating && `Now showing vocabulary word ${currentIndex + 1} of ${totalWords}. Word: ${vocabularyData.word}. Part of speech: ${vocabularyData.partOfSpeech}. Definition: ${vocabularyData.definition}.`}
        </div>
        <div aria-live="assertive" aria-atomic="true">
          {isLoading && 'Loading vocabulary card content...'}
          {isAnimating && 'Transitioning to new vocabulary word...'}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.vocabularyData.word === nextProps.vocabularyData.word &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.totalWords === nextProps.totalWords &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.direction === nextProps.direction &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className
  );
});