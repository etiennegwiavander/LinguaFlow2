'use client';

import React from 'react';
import { Loader2, Brain, MessageSquare, Search, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  className?: string;
}

// Animated loading spinner with custom icon
interface AnimatedLoaderProps extends LoadingStateProps {
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function AnimatedLoader({ 
  icon = <Loader2 className="h-6 w-6" />, 
  size = 'md',
  color = 'text-primary',
  className 
}: AnimatedLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin', color, sizeClasses[size])}>
        {icon}
      </div>
    </div>
  );
}

// Loading state for AI question generation with progress
interface AIGenerationLoadingProps extends LoadingStateProps {
  progress: number; // 0-100
  currentStep: string;
  topicTitle?: string;
  estimatedTime?: string;
}

export function AIGenerationLoading({
  progress,
  currentStep,
  topicTitle,
  estimatedTime,
  className
}: AIGenerationLoadingProps) {
  return (
    <Card className={cn('border-blue-200 bg-blue-50/50 dark:bg-blue-950/20', className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
          <Brain className="mr-2 h-5 w-5 animate-pulse" />
          Generating Questions
        </CardTitle>
        {topicTitle && (
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Creating personalized questions for "{topicTitle}"
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress visualization */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {currentStep}
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2 bg-blue-100 dark:bg-blue-900/30"
          />
          
          {estimatedTime && (
            <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
              Estimated time remaining: {estimatedTime}
            </p>
          )}
        </div>

        {/* AI animation */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <Brain className="h-12 w-12 text-blue-500 animate-pulse" />
            <div className="absolute -inset-2 rounded-full border-2 border-blue-300 animate-ping opacity-20" />
            <div className="absolute -inset-1 rounded-full border border-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Progress steps indicator */}
        <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
          <div className={cn('flex flex-col items-center', progress >= 20 && 'text-blue-700 dark:text-blue-300')}>
            <div className={cn('w-2 h-2 rounded-full mb-1', progress >= 20 ? 'bg-blue-500' : 'bg-blue-300')} />
            <span>Analyzing</span>
          </div>
          <div className={cn('flex flex-col items-center', progress >= 50 && 'text-blue-700 dark:text-blue-300')}>
            <div className={cn('w-2 h-2 rounded-full mb-1', progress >= 50 ? 'bg-blue-500' : 'bg-blue-300')} />
            <span>Generating</span>
          </div>
          <div className={cn('flex flex-col items-center', progress >= 80 && 'text-blue-700 dark:text-blue-300')}>
            <div className={cn('w-2 h-2 rounded-full mb-1', progress >= 80 ? 'bg-blue-500' : 'bg-blue-300')} />
            <span>Optimizing</span>
          </div>
          <div className={cn('flex flex-col items-center', progress >= 95 && 'text-blue-700 dark:text-blue-300')}>
            <div className={cn('w-2 h-2 rounded-full mb-1', progress >= 95 ? 'bg-blue-500' : 'bg-blue-300')} />
            <span>Finalizing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading state for topic search/filtering
export function TopicSearchLoading({ className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <div className="flex items-center space-x-3">
        <Search className="h-5 w-5 text-muted-foreground animate-pulse" />
        <span className="text-muted-foreground">Searching topics...</span>
      </div>
    </div>
  );
}

// Loading state for custom topic creation
export function CustomTopicCreationLoading({ className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center space-x-2 py-2', className)}>
      <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
      <span className="text-sm text-muted-foreground">Creating custom topic...</span>
    </div>
  );
}

// Loading state for flashcard navigation
export function FlashcardNavigationLoading({ className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-4', className)}>
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading question...</span>
      </div>
    </div>
  );
}

// Inline loading spinner for buttons and small components
interface InlineLoadingProps extends LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md';
}

export function InlineLoading({ text, size = 'sm', className }: InlineLoadingProps) {
  const spinnerSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Loader2 className={cn('animate-spin', spinnerSize)} />
      {text && (
        <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {text}
        </span>
      )}
    </div>
  );
}

// Pulsing dots loader for subtle loading states
export function PulsingDots({ className }: LoadingStateProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
}

// Loading overlay for full-screen loading states
interface LoadingOverlayProps extends LoadingStateProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  onCancel?: () => void;
}

export function LoadingOverlay({
  message = 'Loading...',
  subMessage,
  progress,
  onCancel,
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'bg-background/80 backdrop-blur-sm',
      className
    )}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AnimatedLoader size="lg" />
            
            <div className="space-y-2">
              <h3 className="font-medium">{message}</h3>
              {subMessage && (
                <p className="text-sm text-muted-foreground">{subMessage}</p>
              )}
            </div>

            {progress !== undefined && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Shimmer effect for content loading
export function ShimmerEffect({ className }: LoadingStateProps) {
  return (
    <div className={cn(
      'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted',
      'bg-[length:200%_100%] animate-shimmer',
      className
    )} />
  );
}

// Loading state with retry functionality
interface LoadingWithRetryProps extends LoadingStateProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  showRetry?: boolean;
}

export function LoadingWithRetry({
  message,
  onRetry,
  retryText = 'Retry',
  showRetry = false,
  className
}: LoadingWithRetryProps) {
  return (
    <div className={cn('text-center py-8 space-y-4', className)}>
      <AnimatedLoader />
      <div className="space-y-2">
        <p className="text-muted-foreground">{message}</p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}