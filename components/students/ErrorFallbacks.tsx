'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Brain, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorFallbackProps {
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
}

// Generic error fallback
export function GenericErrorFallback({ onRetry, onReset, className }: ErrorFallbackProps) {
  return (
    <Card className={`border-destructive/50 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Something went wrong
        </CardTitle>
        <CardDescription>
          An unexpected error occurred. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="outline">
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// AI Generation failure fallback
interface AIGenerationErrorProps extends ErrorFallbackProps {
  topicTitle?: string;
  error?: string;
}

export function AIGenerationErrorFallback({ 
  topicTitle, 
  error, 
  onRetry, 
  className 
}: AIGenerationErrorProps) {
  return (
    <Card className={`border-orange-200 bg-orange-50 dark:bg-orange-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
          <Brain className="mr-2 h-5 w-5" />
          Question Generation Failed
        </CardTitle>
        <CardDescription className="text-orange-600 dark:text-orange-400">
          {topicTitle ? `Unable to generate questions for "${topicTitle}"` : 'Unable to generate questions'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-100 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">
            AI Service Unavailable
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            {error || 'The AI question generation service is temporarily unavailable. This could be due to high demand or a temporary service issue.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
            What you can do:
          </p>
          <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1 ml-4">
            <li>• Try again in a few moments</li>
            <li>• Check your internet connection</li>
            <li>• Try a different topic</li>
            <li>• Create a custom topic with simpler keywords</li>
          </ul>
        </div>

        {onRetry && (
          <Button onClick={onRetry} variant="default" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Generating Questions Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Network error fallback
export function NetworkErrorFallback({ onRetry, className }: ErrorFallbackProps) {
  return (
    <Card className={`border-red-200 bg-red-50 dark:bg-red-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-700 dark:text-red-300">
          <WifiOff className="mr-2 h-5 w-5" />
          Connection Problem
        </CardTitle>
        <CardDescription className="text-red-600 dark:text-red-400">
          Unable to connect to the server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <Wifi className="h-4 w-4" />
          <AlertTitle>Network Error</AlertTitle>
          <AlertDescription>
            Please check your internet connection and try again.
          </AlertDescription>
        </Alert>

        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Validation error fallback
interface ValidationErrorProps extends ErrorFallbackProps {
  validationErrors: string[];
}

export function ValidationErrorFallback({ 
  validationErrors, 
  onRetry, 
  className 
}: ValidationErrorProps) {
  return (
    <Card className={`border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Input Validation Error
        </CardTitle>
        <CardDescription className="text-yellow-600 dark:text-yellow-400">
          Please correct the following issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-200 bg-yellow-100 dark:bg-yellow-900/20">
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Validation Issues
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <ul className="mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state fallback (when no data is available)
interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyStateFallback({
  title = "No data available",
  description = "There's nothing to show here yet.",
  actionLabel,
  onAction,
  icon,
  className
}: EmptyStateProps) {
  return (
    <Card className={`border-gray-200 ${className || ''}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-gray-400">
          {icon || <MessageSquare className="h-12 w-12" />}
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="default">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Question loading failure fallback
interface QuestionLoadErrorProps extends ErrorFallbackProps {
  topicTitle?: string;
  questionCount?: number;
}

export function QuestionLoadErrorFallback({
  topicTitle,
  questionCount,
  onRetry,
  className
}: QuestionLoadErrorProps) {
  return (
    <Card className={`border-blue-200 bg-blue-50 dark:bg-blue-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
          <MessageSquare className="mr-2 h-5 w-5" />
          Questions Unavailable
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          {topicTitle ? `Unable to load questions for "${topicTitle}"` : 'Unable to load questions'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-100 dark:bg-blue-900/20">
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            {questionCount !== undefined && questionCount > 0
              ? `Only ${questionCount} questions are available, but we couldn't load them properly.`
              : 'No questions are available for this topic yet.'
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Suggestions:
          </p>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 ml-4">
            <li>• Try refreshing the questions</li>
            <li>• Generate new questions for this topic</li>
            <li>• Try a different topic</li>
          </ul>
        </div>

        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Questions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}