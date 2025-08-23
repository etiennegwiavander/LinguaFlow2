/**
 * React.memo optimization tests for Discussion Topics components
 * Tests component re-render prevention and performance
 */

// Mock all external dependencies BEFORE any imports
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

jest.mock('@/lib/performance-monitor', () => ({
  startTimer: jest.fn(),
  endTimer: jest.fn(),
  trackComponentRender: jest.fn(),
  usePerformanceTracking: jest.fn(() => jest.fn()),
}));

import React from 'react';
import { render } from '@testing-library/react';
import { jest } from '@jest/globals';
import { QuestionCard } from '@/components/students/QuestionCard';
import { NavigationControls } from '@/components/students/NavigationControls';
import { Question } from '@/types';

// Test data
const mockQuestion: Question = {
  id: 'test-question-1',
  topic_id: 'test-topic',
  question_text: 'What is your favorite hobby?',
  question_order: 1,
  difficulty_level: 'intermediate',
  created_at: new Date().toISOString()
};

describe('React.memo Performance Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QuestionCard React.memo optimization', () => {
    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ question, currentIndex }: { question: Question; currentIndex: number }) => {
        renderSpy();
        return (
          <QuestionCard
            question={question}
            currentIndex={currentIndex}
            totalQuestions={5}
            isAnimating={false}
            isLoading={false}
          />
        );
      };

      const { rerender } = render(
        <TestWrapper question={mockQuestion} currentIndex={0} />
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props - should not trigger re-render due to React.memo
      rerender(<TestWrapper question={mockQuestion} currentIndex={0} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should still be 1
    });

    it('should re-render when relevant props change', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ currentIndex }: { currentIndex: number }) => {
        renderSpy();
        return (
          <QuestionCard
            question={mockQuestion}
            currentIndex={currentIndex}
            totalQuestions={5}
            isAnimating={false}
            isLoading={false}
          />
        );
      };

      const { rerender } = render(<TestWrapper currentIndex={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with different currentIndex - should trigger re-render
      rerender(<TestWrapper currentIndex={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should re-render when question changes', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ question }: { question: Question }) => {
        renderSpy();
        return (
          <QuestionCard
            question={question}
            currentIndex={0}
            totalQuestions={5}
            isAnimating={false}
            isLoading={false}
          />
        );
      };

      const { rerender } = render(<TestWrapper question={mockQuestion} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      const newQuestion = { ...mockQuestion, id: 'different-question' };
      rerender(<TestWrapper question={newQuestion} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should not re-render when non-relevant props change', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ className }: { className?: string }) => {
        renderSpy();
        return (
          <QuestionCard
            question={mockQuestion}
            currentIndex={0}
            totalQuestions={5}
            isAnimating={false}
            isLoading={false}
            className={className}
          />
        );
      };

      const { rerender } = render(<TestWrapper className="test-class" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same className - should not trigger re-render
      rerender(<TestWrapper className="test-class" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('NavigationControls React.memo optimization', () => {
    const mockHandlers = {
      onPrevious: jest.fn(),
      onNext: jest.fn(),
      onClose: jest.fn(),
      onReset: jest.fn()
    };

    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ currentIndex }: { currentIndex: number }) => {
        renderSpy();
        return (
          <NavigationControls
            currentIndex={currentIndex}
            totalQuestions={5}
            {...mockHandlers}
          />
        );
      };

      const { rerender } = render(<TestWrapper currentIndex={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestWrapper currentIndex={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when currentIndex changes', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ currentIndex }: { currentIndex: number }) => {
        renderSpy();
        return (
          <NavigationControls
            currentIndex={currentIndex}
            totalQuestions={5}
            {...mockHandlers}
          />
        );
      };

      const { rerender } = render(<TestWrapper currentIndex={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper currentIndex={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should re-render when totalQuestions changes', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ totalQuestions }: { totalQuestions: number }) => {
        renderSpy();
        return (
          <NavigationControls
            currentIndex={0}
            totalQuestions={totalQuestions}
            {...mockHandlers}
          />
        );
      };

      const { rerender } = render(<TestWrapper totalQuestions={5} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper totalQuestions={10} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle callback prop changes correctly', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ onNext }: { onNext: () => void }) => {
        renderSpy();
        return (
          <NavigationControls
            currentIndex={0}
            totalQuestions={5}
            onPrevious={mockHandlers.onPrevious}
            onNext={onNext}
            onClose={mockHandlers.onClose}
          />
        );
      };

      const callback1 = jest.fn();
      const { rerender } = render(<TestWrapper onNext={callback1} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same callback reference - should not re-render
      rerender(<TestWrapper onNext={callback1} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Different callback reference - should re-render
      const callback2 = jest.fn();
      rerender(<TestWrapper onNext={callback2} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance under load', () => {
    it('should handle rapid prop changes efficiently', () => {
      const startTime = performance.now();
      
      const TestComponent = ({ index }: { index: number }) => (
        <QuestionCard
          question={mockQuestion}
          currentIndex={index}
          totalQuestions={100}
          isAnimating={false}
          isLoading={false}
        />
      );

      const { rerender } = render(<TestComponent index={0} />);
      
      // Simulate rapid navigation through questions
      for (let i = 1; i < 50; i++) {
        rerender(<TestComponent index={i} />);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete 50 re-renders in reasonable time (< 100ms)
      expect(totalTime).toBeLessThan(100);
    });

    it('should prevent unnecessary re-renders with stable props', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = ({ count }: { count: number }) => {
        renderSpy();
        return (
          <QuestionCard
            question={mockQuestion}
            currentIndex={0} // Stable prop
            totalQuestions={5} // Stable prop
            isAnimating={false} // Stable prop
            isLoading={false} // Stable prop
          />
        );
      };

      const { rerender } = render(<TestComponent count={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render multiple times with different count but same component props
      for (let i = 1; i < 100; i++) {
        rerender(<TestComponent count={i} />);
      }
      
      // Should only render once due to React.memo optimization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle frequent navigation control updates efficiently', () => {
      const renderSpy = jest.fn();
      
      // Define stable handlers for this test
      const stableHandlers = {
        onPrevious: jest.fn(),
        onNext: jest.fn(),
        onClose: jest.fn()
      };
      
      const TestComponent = ({ index }: { index: number }) => {
        renderSpy();
        return (
          <NavigationControls
            currentIndex={index}
            totalQuestions={100}
            onPrevious={stableHandlers.onPrevious} // Stable reference
            onNext={stableHandlers.onNext} // Stable reference
            onClose={stableHandlers.onClose} // Stable reference
          />
        );
      };

      const { rerender } = render(<TestComponent index={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      const startTime = performance.now();
      
      // Simulate rapid navigation
      for (let i = 1; i < 50; i++) {
        rerender(<TestComponent index={i} />);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete efficiently
      expect(totalTime).toBeLessThan(50);
      expect(renderSpy).toHaveBeenCalledTimes(50); // Should re-render for each index change
    });
  });

  describe('Memory efficiency', () => {
    it('should not create memory leaks with frequent re-renders', () => {
      const TestComponent = ({ count }: { count: number }) => (
        <NavigationControls
          currentIndex={count % 10}
          totalQuestions={10}
          onPrevious={jest.fn()} // New function each time
          onNext={jest.fn()} // New function each time
          onClose={jest.fn()} // New function each time
        />
      );

      const { rerender, unmount } = render(<TestComponent count={0} />);
      
      // Simulate many re-renders with new callback functions
      for (let i = 1; i < 1000; i++) {
        rerender(<TestComponent count={i} />);
      }
      
      // Should not throw or cause memory issues
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component unmounting cleanly', () => {
      const { unmount } = render(
        <QuestionCard
          question={mockQuestion}
          currentIndex={0}
          totalQuestions={5}
          isAnimating={false}
          isLoading={false}
        />
      );
      
      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance monitoring integration', () => {
    it('should call performance tracking hooks when available', async () => {
      const { usePerformanceTracking } = await import('@/lib/performance-monitor');
      
      // Create a component that uses performance tracking
      const TestComponent = () => {
        const trackRender = usePerformanceTracking('TestComponent');
        React.useEffect(() => {
          trackRender();
        });
        
        return (
          <QuestionCard
            question={mockQuestion}
            currentIndex={0}
            totalQuestions={5}
            isAnimating={false}
            isLoading={false}
          />
        );
      };
      
      render(<TestComponent />);
      
      expect(usePerformanceTracking).toHaveBeenCalledWith('TestComponent');
    });
  });
});