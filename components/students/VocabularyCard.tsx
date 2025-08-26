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
    vocabularyPerformanceMonitor.startTiming('card-render');
    
    const cleanup = () => {
      vocabularyPerformanceMonitor.endTiming('card-render');
    };
    
    // Use requestAnimationFrame to measure actual render completion
    requestAnimationFrame(cleanup);
    
    return cleanup;
  }, [vocabularyData.word]);

  // Reset expansion state when card changes
  useEffect(() => {
    setIsExamplesExpanded(false);
    setAreExamplesLoaded(false);
  }, [vocabularyData.word]);

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

  // Lazy load examples when expanded
  useEffect(() => {
    if (isExamplesExpanded && !areExamplesLoaded) {
      // Simulate lazy loading with a small delay for smooth UX
      const timer = setTimeout(() => {
        setAreExamplesLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExamplesExpanded, areExamplesLoaded]);

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
    <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto h-full flex flex-col">
      {/* Progress indicator */}
      <div className="mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
          <span>Word {currentIndex + 1} of {totalWords}</span>
          <span className="capitalize text-xs">{vocabularyData.partOfSpeech}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
          <div 
            className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalWords}
            aria-label={`Progress: ${currentIndex + 1} of ${totalWords} vocabulary words`}
          />
        </div>
      </div>

      {/* Main vocabulary card */}
      <Card
        ref={cardRef}
        id="vocabulary-card-content"
        className={cn(
          'vocabulary-card relative flex-1 min-h-0 max-h-full',
          'transition-all duration-300 ease-in-out will-change-transform',
          'vocabulary-focusable focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'hover:shadow-lg cursor-default touch-manipulation',
          'flex flex-col overflow-hidden',
          'contrast-more:border-2 contrast-more:border-foreground',
          'supports-[color-scheme]:color-scheme-auto',
          getAnimationClasses(),
          className
        )}
        tabIndex={0}
        role="article"
        aria-label={`Vocabulary word ${currentIndex + 1} of ${totalWords}: ${vocabularyData.word}`}
        aria-describedby={`word-definition-${currentIndex} word-pronunciation-${currentIndex}`}
      >
        <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col h-full overflow-y-auto">
          <div className={cn(
            "flex flex-col h-full transition-opacity duration-200",
            isContentLoaded ? "opacity-100" : "opacity-0"
          )}>
            {/* Header: Word and Pronunciation with enhanced accessibility */}
            <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-3">
                <h1 
                  className={cn(
                    'vocabulary-word text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground',
                    'contrast-more:text-foreground contrast-more:font-black',
                    'supports-[font-size:clamp]:text-[clamp(1.5rem,4vw,3rem)]'
                  )}
                  id={`vocabulary-word-${currentIndex}`}
                  aria-level={1}
                >
                  {vocabularyData.word}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePronunciation}
                  className={cn(
                    'p-2 hover:bg-primary/10 rounded-full',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'contrast-more:border-2 contrast-more:border-current'
                  )}
                  aria-label={`Play pronunciation for ${vocabularyData.word}. Pronunciation is ${vocabularyData.pronunciation}`}
                  aria-describedby={`word-pronunciation-${currentIndex}`}
                >
                  <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </Button>
              </div>
              
              <div 
                className={cn(
                  'vocabulary-pronunciation text-lg sm:text-xl md:text-2xl text-muted-foreground font-mono',
                  'contrast-more:text-foreground contrast-more:font-bold',
                  'supports-[font-size:clamp]:text-[clamp(1rem,3vw,1.5rem)]'
                )}
                id={`word-pronunciation-${currentIndex}`}
                aria-label={`Pronunciation: ${vocabularyData.pronunciation}`}
                role="text"
              >
                /{vocabularyData.pronunciation}/
              </div>
              
              <div 
                className={cn(
                  'inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium',
                  'contrast-more:bg-primary contrast-more:text-primary-foreground contrast-more:border-2 contrast-more:border-primary'
                )}
                role="text"
                aria-label={`Part of speech: ${vocabularyData.partOfSpeech}`}
              >
                {vocabularyData.partOfSpeech}
              </div>
            </div>

            {/* Body: Definition with enhanced accessibility */}
            <div className="text-center mb-6 sm:mb-8 flex-shrink-0">
              <p 
                className={cn(
                  'vocabulary-definition text-base sm:text-lg md:text-xl text-foreground leading-relaxed px-2',
                  'contrast-more:text-foreground contrast-more:font-semibold',
                  'supports-[font-size:clamp]:text-[clamp(1rem,2.5vw,1.25rem)]'
                )}
                id={`word-definition-${currentIndex}`}
                role="text"
                aria-label={`Definition: ${vocabularyData.definition}`}
              >
                {vocabularyData.definition}
              </p>
            </div>

            {/* Visual separator */}
            <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-primary/20 rounded-full mx-auto mb-6 sm:mb-8" />

            {/* Footer: Expandable Example Sentences */}
            <div className="flex-1 flex flex-col">
              <Collapsible 
                open={isExamplesExpanded} 
                onOpenChange={setIsExamplesExpanded}
                className="flex-1 flex flex-col"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full mb-4 flex items-center justify-center gap-2 hover:bg-primary/5',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      'contrast-more:border-2 contrast-more:border-foreground'
                    )}
                    aria-expanded={isExamplesExpanded}
                    aria-controls={`example-sentences-${currentIndex}`}
                    aria-label={`${isExamplesExpanded ? 'Hide' : 'Show'} example sentences for ${vocabularyData.word}`}
                  >
                    <span>Example Sentences</span>
                    {isExamplesExpanded ? (
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent 
                  id={`example-sentences-${currentIndex}`}
                  className="flex-1 overflow-y-auto max-h-[40vh] sm:max-h-[50vh]"
                  role="region"
                  aria-label={`Example sentences for ${vocabularyData.word} in different tenses`}
                >
                  {areExamplesLoaded ? (
                    <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-top-2 duration-200">
                      {tenseCategories.map(({ key, label, sentence }, index) => (
                        sentence && (
                          <div key={key} className="space-y-2" role="group" aria-labelledby={`tense-label-${currentIndex}-${index}`}>
                            <h3 
                              id={`tense-label-${currentIndex}-${index}`}
                              className={cn(
                                'text-sm font-semibold text-primary uppercase tracking-wide',
                                'contrast-more:text-foreground contrast-more:font-bold'
                              )}
                              role="heading"
                              aria-level={3}
                            >
                              {label}
                            </h3>
                            <p 
                              className={cn(
                                'vocabulary-example text-sm sm:text-base text-foreground leading-relaxed pl-4 border-l-2 border-primary/20',
                                'contrast-more:border-l-4 contrast-more:border-foreground contrast-more:font-medium',
                                'supports-[font-size:clamp]:text-[clamp(0.875rem,2vw,1rem)]'
                              )}
                              dangerouslySetInnerHTML={{
                                __html: highlightVocabularyWord(sentence, vocabularyData.word)
                              }}
                              role="text"
                              aria-label={`${label} tense example: ${sentence.replace(/<\/?strong>/g, '')}`}
                            />
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6" aria-label="Loading example sentences">
                      {/* Loading skeleton for examples */}
                      {[1, 2, 3, 4, 5, 6].map((index) => (
                        <div key={index} className="space-y-2 animate-pulse" aria-hidden="true">
                          <div className="h-3 bg-muted rounded w-20"></div>
                          <div className="h-4 bg-muted rounded w-full ml-4"></div>
                        </div>
                      ))}
                      <div className="sr-only" aria-live="polite">
                        Loading example sentences for {vocabularyData.word}...
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </CardContent>

        {/* Decorative elements for visual appeal */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary/20 rounded-full" />
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-1 sm:w-1 h-1 sm:h-1 bg-primary/10 rounded-full" />
      </Card>

      {/* Enhanced screen reader announcements */}
      <div className="sr-only">
        <div 
          aria-live="polite" 
          aria-atomic="true"
          id={`card-status-${currentIndex}`}
        >
          {!isAnimating && `Now showing vocabulary word ${currentIndex + 1} of ${totalWords}. Word: ${vocabularyData.word}. Part of speech: ${vocabularyData.partOfSpeech}. Definition: ${vocabularyData.definition}. ${isExamplesExpanded ? 'Example sentences are expanded and visible.' : 'Example sentences are collapsed. Press Enter or Space to expand.'}`}
        </div>
        <div 
          aria-live="assertive" 
          aria-atomic="true"
          id={`card-loading-${currentIndex}`}
        >
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