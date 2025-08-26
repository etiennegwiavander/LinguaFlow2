import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VocabularyErrorBoundary, withVocabularyErrorBoundary, useVocabularyErrorHandler } from '@/components/students/VocabularyErrorBoundary';
import { 
  VocabularyGenerationErrorFallback,
  SessionCorruptionErrorFallback,
  VocabularyNetworkErrorFallback,
  EmptyVocabularyStateFallback,
  VocabularyTimeoutErrorFallback,
  GenericVocabularyErrorFallback
} from '@/components/students/VocabularyErrorFallbacks';

// Mock components for testing
const ThrowingComponent = ({ shouldThrow, errorType }: { shouldThrow: boolean; errorType?: string }) => {
  if (shouldThrow) {
    const error = new Error(`Test ${errorType || 'generic'} error`);
    if (errorType === 'vocabulary-generation') {
      error.message = 'vocabulary generation failed';
    } else if (errorType === 'session-corruption') {
      error.message = 'session corrupt data found';
    } else if (errorType === 'network') {
      error.message = 'network connection failed';
    }
    throw error;
  }
  return <div>Component working correctly</div>;
};

const TestComponentWithHook = ({ shouldError }: { shouldError: boolean }) => {
  const { handleError, resetError } = useVocabularyErrorHandler();
  
  React.useEffect(() => {
    if (shouldError) {
      handleError(new Error('Hook test error'));
    }
  }, [shouldError, handleError]);

  return (
    <div>
      <span>Hook component</span>
      <button onClick={resetError}>Reset Error</button>
    </div>
  );
};

describe('VocabularyErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <VocabularyErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Component working correctly')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <VocabularyErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Vocabulary Flashcards Error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to generate vocabulary words/)).toBeInTheDocument();
  });

  it('classifies vocabulary generation errors correctly', () => {
    render(
      <VocabularyErrorBoundary>
        <ThrowingComponent shouldThrow={true} errorType="vocabulary-generation" />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText(/Failed to generate vocabulary words/)).toBeInTheDocument();
  });

  it('classifies session corruption errors correctly', () => {
    render(
      <VocabularyErrorBoundary>
        <ThrowingComponent shouldThrow={true} errorType="session-corruption" />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText(/session data appears to be corrupted/)).toBeInTheDocument();
  });

  it('classifies network errors correctly', () => {
    render(
      <VocabularyErrorBoundary>
        <ThrowingComponent shouldThrow={true} errorType="network" />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText(/Unable to connect to vocabulary services/)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <VocabularyErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </VocabularyErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('allows retry after error', async () => {
    let shouldThrow = true;
    const TestComponent = () => <ThrowingComponent shouldThrow={shouldThrow} />;
    
    const { rerender } = render(
      <VocabularyErrorBoundary>
        <TestComponent />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Vocabulary Flashcards Error')).toBeInTheDocument();

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Change the component to not throw
    shouldThrow = false;
    
    rerender(
      <VocabularyErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </VocabularyErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Component working correctly')).toBeInTheDocument();
    });
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = jest.fn();
    
    render(
      <VocabularyErrorBoundary onReset={onReset}>
        <ThrowingComponent shouldThrow={true} />
      </VocabularyErrorBoundary>
    );

    const resetButton = screen.getByText('Reset Session');
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>;
    
    render(
      <VocabularyErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <VocabularyErrorBoundary showErrorDetails={true}>
        <ThrowingComponent shouldThrow={true} />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Technical Details')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('withVocabularyErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('wraps component with error boundary', () => {
    const WrappedComponent = withVocabularyErrorBoundary(ThrowingComponent);
    
    render(<WrappedComponent shouldThrow={false} />);
    
    expect(screen.getByText('Component working correctly')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withVocabularyErrorBoundary(ThrowingComponent);
    
    render(<WrappedComponent shouldThrow={true} />);
    
    expect(screen.getByText('Vocabulary Flashcards Error')).toBeInTheDocument();
  });
});

describe('useVocabularyErrorHandler hook', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('throws error to be caught by error boundary', () => {
    render(
      <VocabularyErrorBoundary>
        <TestComponentWithHook shouldError={true} />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Vocabulary Flashcards Error')).toBeInTheDocument();
  });

  it('does not throw when no error', () => {
    render(
      <VocabularyErrorBoundary>
        <TestComponentWithHook shouldError={false} />
      </VocabularyErrorBoundary>
    );

    expect(screen.getByText('Hook component')).toBeInTheDocument();
  });
});

describe('Vocabulary Error Fallback Components', () => {
  describe('VocabularyGenerationErrorFallback', () => {
    it('renders generation error with student info', () => {
      render(
        <VocabularyGenerationErrorFallback
          studentName="John Doe"
          proficiencyLevel="B1"
          error="AI service unavailable"
        />
      );

      expect(screen.getByText('Vocabulary Generation Failed')).toBeInTheDocument();
      expect(screen.getByText(/Unable to generate vocabulary words for John Doe \(B1 level\)/)).toBeInTheDocument();
      expect(screen.getByText(/AI service unavailable/)).toBeInTheDocument();
    });

    it('renders retry and fallback buttons', () => {
      const onRetry = jest.fn();
      const onReset = jest.fn();

      render(
        <VocabularyGenerationErrorFallback
          onRetry={onRetry}
          onReset={onReset}
        />
      );

      const retryButton = screen.getByText('Try Again');
      const fallbackButton = screen.getByText('Use Fallback Words');

      fireEvent.click(retryButton);
      fireEvent.click(fallbackButton);

      expect(onRetry).toHaveBeenCalled();
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('SessionCorruptionErrorFallback', () => {
    it('renders session corruption error', () => {
      render(
        <SessionCorruptionErrorFallback
          studentName="Jane Smith"
          sessionId="session-123"
        />
      );

      expect(screen.getByText('Session Data Corrupted')).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith's vocabulary session data appears to be corrupted/)).toBeInTheDocument();
      expect(screen.getByText(/session-123/)).toBeInTheDocument();
    });
  });

  describe('VocabularyNetworkErrorFallback', () => {
    it('renders network error with offline options', () => {
      render(<VocabularyNetworkErrorFallback />);

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to vocabulary services/)).toBeInTheDocument();
      expect(screen.getByText(/Use cached vocabulary words if available/)).toBeInTheDocument();
    });
  });

  describe('EmptyVocabularyStateFallback', () => {
    it('renders different messages based on reason', () => {
      const { rerender } = render(
        <EmptyVocabularyStateFallback reason="all-seen" studentName="John" />
      );

      expect(screen.getByText('All Words Completed!')).toBeInTheDocument();
      expect(screen.getByText(/Congratulations/)).toBeInTheDocument();

      rerender(
        <EmptyVocabularyStateFallback reason="generation-failed" />
      );

      expect(screen.getByText('No Words Available')).toBeInTheDocument();

      rerender(
        <EmptyVocabularyStateFallback reason="no-words" />
      );

      expect(screen.getByText('No Vocabulary Words')).toBeInTheDocument();
    });
  });

  describe('VocabularyTimeoutErrorFallback', () => {
    it('renders timeout error with duration', () => {
      render(
        <VocabularyTimeoutErrorFallback
          timeoutDuration={45}
          studentName="Alice"
        />
      );

      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
      expect(screen.getByText(/Vocabulary generation for Alice is taking longer than expected/)).toBeInTheDocument();
      expect(screen.getByText(/didn't respond within 45 seconds/)).toBeInTheDocument();
    });
  });

  describe('GenericVocabularyErrorFallback', () => {
    it('renders generic error with all action buttons', () => {
      const onRetry = jest.fn();
      const onReset = jest.fn();
      const onGoBack = jest.fn();

      render(
        <GenericVocabularyErrorFallback
          onRetry={onRetry}
          onReset={onReset}
          onGoBack={onGoBack}
        />
      );

      expect(screen.getByText('Vocabulary Error')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      const resetButton = screen.getByText('Reset Session');
      const backButton = screen.getByText('Go Back');

      fireEvent.click(retryButton);
      fireEvent.click(resetButton);
      fireEvent.click(backButton);

      expect(onRetry).toHaveBeenCalled();
      expect(onReset).toHaveBeenCalled();
      expect(onGoBack).toHaveBeenCalled();
    });
  });
});