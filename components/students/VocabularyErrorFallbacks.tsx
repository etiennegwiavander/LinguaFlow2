'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Brain, BookOpen, Zap, Database, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VocabularyErrorFallbackProps {
  onRetry?: () => void;
  onReset?: () => void;
  onGoBack?: () => void;
  className?: string;
}

// Vocabulary generation failure fallback
interface VocabularyGenerationErrorProps extends VocabularyErrorFallbackProps {
  studentName?: string;
  error?: string;
  proficiencyLevel?: string;
}

export function VocabularyGenerationErrorFallback({ 
  studentName, 
  error, 
  proficiencyLevel,
  onRetry, 
  onReset,
  className 
}: VocabularyGenerationErrorProps) {
  return (
    <Card className={`border-orange-200 bg-orange-50 dark:bg-orange-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
          <Brain className="mr-2 h-5 w-5" />
          Vocabulary Generation Failed
        </CardTitle>
        <CardDescription className="text-orange-600 dark:text-orange-400">
          {studentName 
            ? `Unable to generate vocabulary words for ${studentName}${proficiencyLevel ? ` (${proficiencyLevel} level)` : ''}`
            : 'Unable to generate vocabulary words'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-100 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">
            AI Service Unavailable
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            {error || 'The AI vocabulary generation service is temporarily unavailable. This could be due to high demand or a temporary service issue.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
            What you can do:
          </p>
          <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1 ml-4">
            <li>• Try again in a few moments</li>
            <li>• Check your internet connection</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Session corruption recovery fallback
interface SessionCorruptionErrorProps extends VocabularyErrorFallbackProps {
  studentName?: string;
  sessionId?: string;
}

export function SessionCorruptionErrorFallback({
  studentName,
  sessionId,
  onRetry,
  onReset,
  className
}: SessionCorruptionErrorProps) {
  return (
    <Card className={`border-red-200 bg-red-50 dark:bg-red-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-700 dark:text-red-300">
          <Database className="mr-2 h-5 w-5" />
          Session Data Corrupted
        </CardTitle>
        <CardDescription className="text-red-600 dark:text-red-400">
          {studentName 
            ? `${studentName}'s vocabulary session data appears to be corrupted`
            : 'The vocabulary session data appears to be corrupted'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Recovery Needed</AlertTitle>
          <AlertDescription>
            The session data cannot be loaded properly. This might be due to browser storage issues or data corruption.
            {sessionId && (
              <div className="mt-2 text-xs font-mono bg-destructive/10 p-2 rounded">
                Session ID: {sessionId}
              </div>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Recovery options:
          </p>
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 ml-4">
            <li>• Try recovering from backup data</li>
            <li>• Start a fresh vocabulary session</li>
            <li>• Clear corrupted session data</li>
            <li>• Contact support for data recovery</li>
          </ul>
        </div>

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Recovery
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="destructive">
              <Zap className="mr-2 h-4 w-4" />
              Start Fresh Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Network connectivity error for vocabulary features
export function VocabularyNetworkErrorFallback({ 
  onRetry, 
  onReset,
  className 
}: VocabularyErrorFallbackProps) {
  return (
    <Card className={`border-red-200 bg-red-50 dark:bg-red-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-700 dark:text-red-300">
          <WifiOff className="mr-2 h-5 w-5" />
          Connection Problem
        </CardTitle>
        <CardDescription className="text-red-600 dark:text-red-400">
          Unable to connect to vocabulary services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <Wifi className="h-4 w-4" />
          <AlertTitle>Network Error</AlertTitle>
          <AlertDescription>
            Cannot connect to the vocabulary generation service. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            While offline, you can:
          </p>
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 ml-4">
            <li>• Use cached vocabulary words if available</li>
            <li>• Review previously studied words</li>
            <li>• Try again when connection is restored</li>
          </ul>
        </div>

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Empty vocabulary state fallback
interface EmptyVocabularyStateProps extends VocabularyErrorFallbackProps {
  studentName?: string;
  proficiencyLevel?: string;
  reason?: 'no-words' | 'all-seen' | 'generation-failed';
}

export function EmptyVocabularyStateFallback({
  studentName,
  proficiencyLevel,
  reason = 'no-words',
  onRetry,
  onReset,
  className
}: EmptyVocabularyStateProps) {
  const getTitle = () => {
    switch (reason) {
      case 'all-seen':
        return 'All Words Completed!';
      case 'generation-failed':
        return 'No Words Available';
      default:
        return 'No Vocabulary Words';
    }
  };

  const getDescription = () => {
    switch (reason) {
      case 'all-seen':
        return `${studentName || 'Student'} has seen all available words at the ${proficiencyLevel || 'current'} level`;
      case 'generation-failed':
        return 'Unable to generate vocabulary words at this time';
      default:
        return 'No vocabulary words are currently available';
    }
  };

  const getIcon = () => {
    switch (reason) {
      case 'all-seen':
        return <BookOpen className="h-12 w-12 text-green-400" />;
      case 'generation-failed':
        return <AlertTriangle className="h-12 w-12 text-orange-400" />;
      default:
        return <BookOpen className="h-12 w-12 text-gray-400" />;
    }
  };

  return (
    <Card className={`border-gray-200 ${className || ''}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          {getIcon()}
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {getTitle()}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {getDescription()}
        </p>

        {reason === 'all-seen' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 dark:text-green-300">
              🎉 Congratulations! You've mastered all vocabulary words at this level. 
              Consider moving to the next proficiency level or generating new words.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              {reason === 'all-seen' ? 'Generate New Words' : 'Try Again'}
            </Button>
          )}
          {onReset && (
            <Button onClick={onReset} variant="outline">
              <Database className="mr-2 h-4 w-4" />
              {reason === 'all-seen' ? 'Reset Progress' : 'Reset Session'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Vocabulary loading timeout fallback
interface VocabularyTimeoutErrorProps extends VocabularyErrorFallbackProps {
  timeoutDuration?: number;
  studentName?: string;
}

export function VocabularyTimeoutErrorFallback({
  timeoutDuration = 30,
  studentName,
  onRetry,
  onReset,
  className
}: VocabularyTimeoutErrorProps) {
  return (
    <Card className={`border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
          <Clock className="mr-2 h-5 w-5" />
          Request Timeout
        </CardTitle>
        <CardDescription className="text-yellow-600 dark:text-yellow-400">
          {studentName 
            ? `Vocabulary generation for ${studentName} is taking longer than expected`
            : 'Vocabulary generation is taking longer than expected'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-200 bg-yellow-100 dark:bg-yellow-900/20">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Service Timeout
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            The vocabulary generation service didn't respond within {timeoutDuration} seconds. 
            This might be due to high server load or complex processing requirements.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
            Recommended actions:
          </p>
          <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1 ml-4">
            <li>• Wait a moment and try again</li>
            <li>• Use simpler vocabulary criteria</li>
            <li>• Try generating fewer words at once</li>
          </ul>
        </div>

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Generic vocabulary error fallback
export function GenericVocabularyErrorFallback({ 
  onRetry, 
  onReset, 
  onGoBack,
  className 
}: VocabularyErrorFallbackProps) {
  return (
    <Card className={`border-destructive/50 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Vocabulary Error
        </CardTitle>
        <CardDescription>
          An unexpected error occurred with the vocabulary flashcards feature.
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
              <Database className="mr-2 h-4 w-4" />
              Reset Session
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="ghost">
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}