'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

// Base skeleton component
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

// Topics list skeleton loader
export function TopicsListSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Search input skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Custom topic input skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Topics grid skeleton */}
      <div className="space-y-4">
        {/* Category header skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>

        {/* Topics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TopicCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Second category */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TopicCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual topic card skeleton
export function TopicCardSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-32 flex-1" />
          <Skeleton className="h-4 w-4 ml-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Question generation skeleton with progress
interface QuestionGenerationSkeletonProps extends SkeletonProps {
  progress?: string;
  topicTitle?: string;
}

export function QuestionGenerationSkeleton({ 
  progress = "Generating questions...", 
  topicTitle,
  className 
}: QuestionGenerationSkeletonProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {/* Animated loading spinner skeleton */}
          <div className="relative">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          
          {/* Progress text */}
          <div className="text-center space-y-2">
            <div className="font-medium text-sm">{progress}</div>
            {topicTitle && (
              <div className="text-xs text-muted-foreground">
                Creating personalized questions for "{topicTitle}"
              </div>
            )}
          </div>

          {/* Progress bar skeleton */}
          <div className="w-full max-w-xs">
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Flashcard skeleton loader
export function FlashcardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Question card skeleton */}
      <Card className="max-w-4xl mx-auto shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Navigation controls skeleton */}
      <div className="flex items-center justify-center space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Discussion topics tab skeleton
export function DiscussionTopicsTabSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn('floating-card glass-effect border-cyber-400/20', className)}>
      <CardHeader>
        <div className="flex items-center">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-80" />
      </CardHeader>
      <CardContent>
        <TopicsListSkeleton />
      </CardContent>
    </Card>
  );
}

// Progress bar component for AI generation
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  className?: string;
}

export function ProgressBar({ progress, label, className }: ProgressBarProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Animated pulse loader for inline loading states
export function PulseLoader({ className }: SkeletonProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
}