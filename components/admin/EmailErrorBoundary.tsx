'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EmailErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Email Management Error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Email Management Error</AlertTitle>
            <AlertDescription>
              Something went wrong while loading the email management interface.
              This could be due to a network issue or a temporary server problem.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">What you can try:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Refresh the page to reload the interface</li>
              <li>Check your internet connection</li>
              <li>Try again in a few minutes</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="bg-red-50 p-4 rounded-lg mb-4">
              <summary className="cursor-pointer font-semibold text-red-800">
                Technical Details (Development Only)
              </summary>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin-portal'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Admin Portal
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withEmailErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <EmailErrorBoundary fallback={fallback}>
        <Component {...props} />
      </EmailErrorBoundary>
    );
  };
}