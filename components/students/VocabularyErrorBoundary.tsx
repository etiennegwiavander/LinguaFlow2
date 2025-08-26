'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GenericVocabularyErrorFallback } from './VocabularyErrorFallbacks';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  onGoBack?: () => void;
  showErrorDetails?: boolean;
  studentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  errorType: 'vocabulary-generation' | 'session-corruption' | 'network' | 'generic';
}

export class VocabularyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      errorType: 'generic'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Classify error type based on error message and properties
    const errorType = VocabularyErrorBoundary.classifyError(error);
    
    return {
      hasError: true,
      error,
      errorType,
      errorId: `vocab-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  static classifyError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Check for vocabulary generation errors
    if (message.includes('vocabulary') && (message.includes('generation') || message.includes('generate'))) {
      return 'vocabulary-generation';
    }
    
    // Check for session-related errors
    if (message.includes('session') && (message.includes('corrupt') || message.includes('invalid'))) {
      return 'session-corruption';
    }
    
    // Check for network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    // Check for specific vocabulary-related errors in stack trace
    if (stack.includes('vocabulary') || stack.includes('flashcard')) {
      return 'vocabulary-generation';
    }
    
    return 'generic';
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details with vocabulary context
    console.error('VocabularyErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service with vocabulary context
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { 
      //   extra: { 
      //     ...errorInfo, 
      //     feature: 'vocabulary-flashcards',
      //     studentName: this.props.studentName,
      //     errorType: this.state.errorType
      //   } 
      // });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      errorType: 'generic'
    });
  };

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.handleRetry();
  };

  handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    }
    this.handleRetry();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use generic vocabulary error fallback for simple cases
      if (this.state.errorType === 'generic' && !this.props.showErrorDetails) {
        return (
          <GenericVocabularyErrorFallback
            onRetry={this.handleRetry}
            onReset={this.handleReset}
            onGoBack={this.handleGoBack}
          />
        );
      }

      // Detailed vocabulary-specific error UI
      return (
        <Card className="max-w-2xl mx-auto mt-8 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <BookOpen className="mr-2 h-5 w-5" />
              Vocabulary Flashcards Error
            </CardTitle>
            <CardDescription>
              {this.getErrorDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-medium">{this.state.error?.name}</p>
                  <p className="text-sm mt-1">{this.state.error?.message}</p>
                  
                  {/* Error type specific guidance */}
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Troubleshooting:</p>
                    <ul className="text-xs space-y-1">
                      {this.getTroubleshootingSteps()}
                    </ul>
                  </div>
                  
                  {this.props.showErrorDetails && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Technical Details
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={this.handleRetry} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              {this.props.onReset && (
                <Button onClick={this.handleReset} variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Reset Session
                </Button>
              )}
              
              {this.props.onGoBack && (
                <Button onClick={this.handleGoBack} variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              )}
              
              <Button onClick={this.handleReload} variant="ghost">
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Error ID: {this.state.errorId}</div>
                <div>Error Type: {this.state.errorType}</div>
                {this.props.studentName && <div>Student: {this.props.studentName}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }

  private getErrorDescription(): string {
    const { errorType } = this.state;
    const { studentName } = this.props;
    
    switch (errorType) {
      case 'vocabulary-generation':
        return `Failed to generate vocabulary words${studentName ? ` for ${studentName}` : ''}. The AI service may be temporarily unavailable.`;
      case 'session-corruption':
        return `The vocabulary session data appears to be corrupted${studentName ? ` for ${studentName}` : ''}. A fresh session may be needed.`;
      case 'network':
        return 'Unable to connect to vocabulary services. Please check your internet connection.';
      default:
        return 'An unexpected error occurred in the vocabulary flashcards feature.';
    }
  }

  private getTroubleshootingSteps(): ReactNode[] {
    const { errorType } = this.state;
    
    switch (errorType) {
      case 'vocabulary-generation':
        return [
          <li key="1">• Check your internet connection</li>,
          <li key="2">• Try again in a few moments</li>,
          <li key="3">• Use fallback vocabulary if available</li>,
          <li key="4">• Contact support if the problem persists</li>
        ];
      case 'session-corruption':
        return [
          <li key="1">• Try refreshing the page</li>,
          <li key="2">• Clear browser storage for this site</li>,
          <li key="3">• Start a new vocabulary session</li>,
          <li key="4">• Contact support for data recovery</li>
        ];
      case 'network':
        return [
          <li key="1">• Check your internet connection</li>,
          <li key="2">• Try refreshing the page</li>,
          <li key="3">• Use offline mode if available</li>,
          <li key="4">• Try again when connection is restored</li>
        ];
      default:
        return [
          <li key="1">• Try refreshing the page</li>,
          <li key="2">• Clear browser cache</li>,
          <li key="3">• Try again in a few moments</li>,
          <li key="4">• Contact support if the problem persists</li>
        ];
    }
  }
}

// Higher-order component for easier usage with vocabulary components
export function withVocabularyErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <VocabularyErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </VocabularyErrorBoundary>
  );

  WrappedComponent.displayName = `withVocabularyErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for vocabulary error handling in functional components
export function useVocabularyErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    // Add vocabulary context to error
    const vocabularyError = new Error(`Vocabulary Error: ${error.message}`);
    vocabularyError.stack = error.stack;
    vocabularyError.name = error.name;
    setError(vocabularyError);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}