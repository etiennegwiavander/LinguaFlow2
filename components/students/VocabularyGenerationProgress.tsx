'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocabularyGenerationProgressProps {
  isGenerating: boolean;
  estimatedDuration?: number; // in seconds, default 120 (2 minutes)
  className?: string;
}

const GENERATION_STAGES = [
  { 
    id: 1, 
    label: 'Analyzing student profile', 
    icon: Brain, 
    duration: 10,
    description: 'Understanding your learning goals and level'
  },
  { 
    id: 2, 
    label: 'Generating personalized vocabulary', 
    icon: Sparkles, 
    duration: 90,
    description: 'Creating 20 words tailored to your needs'
  },
  { 
    id: 3, 
    label: 'Creating example sentences', 
    icon: BookOpen, 
    duration: 15,
    description: 'Generating 6 contextual examples per word'
  },
  { 
    id: 4, 
    label: 'Finalizing flashcards', 
    icon: CheckCircle2, 
    duration: 5,
    description: 'Preparing your personalized learning session'
  }
];

export function VocabularyGenerationProgress({ 
  isGenerating, 
  estimatedDuration = 120,
  className 
}: VocabularyGenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(estimatedDuration);

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setCurrentStage(0);
      setElapsedTime(0);
      setEstimatedTimeRemaining(estimatedDuration);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Calculate progress (0-100%)
      const calculatedProgress = Math.min((elapsed / estimatedDuration) * 100, 99);
      setProgress(calculatedProgress);

      // Calculate time remaining
      const remaining = Math.max(estimatedDuration - elapsed, 0);
      setEstimatedTimeRemaining(remaining);

      // Determine current stage based on elapsed time
      let cumulativeDuration = 0;
      let stage = 0;
      for (let i = 0; i < GENERATION_STAGES.length; i++) {
        cumulativeDuration += GENERATION_STAGES[i].duration;
        if (elapsed < cumulativeDuration) {
          stage = i;
          break;
        }
        stage = i + 1;
      }
      setCurrentStage(Math.min(stage, GENERATION_STAGES.length - 1));
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isGenerating, estimatedDuration]);

  if (!isGenerating) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Generating Your Vocabulary
          </CardTitle>
          <div className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
        <CardDescription>
          Creating personalized flashcards tailored to your learning goals
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            <span>Estimated remaining: {formatTime(estimatedTimeRemaining)}</span>
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="space-y-3">
          {GENERATION_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all duration-300",
                  isActive && "bg-primary/10 border border-primary/20",
                  isCompleted && "opacity-60",
                  !isActive && !isCompleted && "opacity-40"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isActive && "bg-primary text-primary-foreground animate-pulse",
                  isCompleted && "bg-green-500 text-white",
                  !isActive && !isCompleted && "bg-muted"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-green-600 dark:text-green-400"
                    )}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <span className="text-xs text-muted-foreground animate-pulse">
                        In progress...
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">AI-Powered Personalization</span>
          </div>
          <p className="text-xs text-muted-foreground">
            We're analyzing your learning profile to create vocabulary that matches your level, 
            goals, and areas for improvement. This ensures maximum learning efficiency.
          </p>
        </div>

        {/* Helpful Tip */}
        <div className="text-center text-xs text-muted-foreground">
          💡 Tip: This process typically takes 2-3 minutes. Your flashcards will be ready soon!
        </div>
      </CardContent>
    </Card>
  );
}
