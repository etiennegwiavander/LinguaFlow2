/**
 * Performance optimization tests for Discussion Topics components
 * Tests React.memo effectiveness and render performance
 */

// Mock all external dependencies BEFORE any imports
jest.mock('@/lib/performance-monitor', () => ({
  startTimer: jest.fn(),
  endTimer: jest.fn(),
  trackComponentRender: jest.fn(),
  usePerformanceTracking: jest.fn(() => jest.fn()),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  }
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } }
      })
    }
  },
  supabaseRequest: jest.fn().mockImplementation((fn) => fn())
}));

jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

jest.mock('@/lib/discussion-topics-db', () => ({
  getDiscussionTopicsByStudent: jest.fn().mockResolvedValue({
    data: [],
    error: null
  }),
  getPredefinedTopicsByLevel: jest.fn().mockResolvedValue({
    data: [],
    error: null
  }),
  createCustomDiscussionTopic: jest.fn().mockResolvedValue({
    data: {
      id: 'test-topic',
      title: 'Test Topic',
      student_id: 'test-student',
      tutor_id: 'test-tutor',
      level: 'intermediate',
      is_custom: true,
      category: 'custom',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    error: null
  }),
  checkTopicExists: jest.fn().mockResolvedValue({
    data: false,
    error: null
  })
}));

jest.mock('@/lib/discussion-cache', () => ({
  getTopicsCache: jest.fn(() => null),
  setTopicsCache: jest.fn(),
  invalidateTopicsCache: jest.fn(),
  getQuestionsCache: jest.fn(() => null),
  setQuestionsCache: jest.fn(),
  shouldRefreshQuestions: jest.fn(() => false),
  updateTopicMetadata: jest.fn(),
  clearExpiredEntries: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { QuestionCard } from '@/components/students/QuestionCard';
import { NavigationControls } from '@/components/students/NavigationControls';
import { FlashcardInterface } from '@/components/students/FlashcardInterface';
import TopicsList from '@/components/students/TopicsList';
import CustomTopicInput from '@/components/students/CustomTopicInput';
import DiscussionTopicsTab from '@/components/students/DiscussionTopicsTab';
import { Question, DiscussionTopic, Student } from '@/types';

// Test data
const mockQuestion: Question = {
  id: 'test-question-1',
  topic_id: 'test-topic',
  question_text: 'What is your favorite hobby?',
  question_order: 1,
  difficulty_level: 'intermediate',
  created_at: new Date().toISOString()
};

const mockTopic: DiscussionTopic = {
  id: 'test-topic',
  student_id: 'test-student',
  tutor_id: 'test-tutor',
  title: 'Hobbies and Interests',
  description: 'Discuss your favorite activities',
  category: 'lifestyle',
  level: 'intermediate',
  is_custom: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockStudent: Student = {
  id: 'test-student',
  name: 'Test Student',
  target_language: 'en',
  native_language: 'es',
  level: 'intermediate',
  age_group: 'adult',
  end_goals: 'Improve conversation skills',
  grammar_weaknesses: null,
  vocabulary_gaps: null,
  pronunciation_challenges: null,
  conversational_fluency_barriers: null,
  learning_styles: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('Component Performance Optimization', () => {
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
          />
        );
      };

      const { rerender } = render(<TestWrapper currentIndex={0} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with different currentIndex - should trigger re-render
      rerender(<TestWrapper currentIndex={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
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
  });

  describe('FlashcardInterface React.memo optimization', () => {
    const mockProps = {
      questions: [mockQuestion],
      isOpen: true,
      onClose: jest.fn(),
      topicTitle: 'Test Topic'
    };

    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ isOpen }: { isOpen: boolean }) => {
        renderSpy();
        return (
          <FlashcardInterface
            {...mockProps}
            isOpen={isOpen}
          />
        );
      };

      const { rerender } = render(<TestWrapper isOpen={true} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper isOpen={true} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when isOpen changes', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ isOpen }: { isOpen: boolean }) => {
        renderSpy();
        return (
          <FlashcardInterface
            {...mockProps}
            isOpen={isOpen}
          />
        );
      };

      const { rerender } = render(<TestWrapper isOpen={false} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper isOpen={true} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('TopicsList React.memo optimization', () => {
    const mockProps = {
      student: mockStudent,
      tutorId: 'test-tutor',
      onTopicSelect: jest.fn()
    };

    it('should not re-render when student props have not changed', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ student }: { student: Student }) => {
        renderSpy();
        return (
          <TopicsList
            {...mockProps}
            student={student}
          />
        );
      };

      const { rerender } = render(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when student level changes', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ student }: { student: Student }) => {
        renderSpy();
        return (
          <TopicsList
            {...mockProps}
            student={student}
          />
        );
      };

      const { rerender } = render(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      const updatedStudent = { ...mockStudent, level: 'advanced' };
      rerender(<TestWrapper student={updatedStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('CustomTopicInput React.memo optimization', () => {
    const mockProps = {
      student: mockStudent,
      tutorId: 'test-tutor',
      onTopicCreated: jest.fn()
    };

    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ student }: { student: Student }) => {
        renderSpy();
        return (
          <CustomTopicInput
            {...mockProps}
            student={student}
          />
        );
      };

      const { rerender } = render(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('DiscussionTopicsTab React.memo optimization', () => {
    it('should not re-render when student props have not changed', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ student }: { student: Student }) => {
        renderSpy();
        return <DiscussionTopicsTab student={student} />;
      };

      const { rerender } = render(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when student id changes', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ student }: { student: Student }) => {
        renderSpy();
        return <DiscussionTopicsTab student={student} />;
      };

      const { rerender } = render(<TestWrapper student={mockStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      const updatedStudent = { ...mockStudent, id: 'different-student' };
      rerender(<TestWrapper student={updatedStudent} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance monitoring integration', () => {
    it('should call performance tracking hooks', async () => {
      const { usePerformanceTracking } = await import('@/lib/performance-monitor');
      
      render(<DiscussionTopicsTab student={mockStudent} />);
      
      expect(usePerformanceTracking).toHaveBeenCalledWith('DiscussionTopicsTab');
    });

    it('should track component renders', async () => {
      const { trackComponentRender } = await import('@/lib/performance-monitor');
      
      render(
        <QuestionCard
          question={mockQuestion}
          currentIndex={0}
          totalQuestions={5}
          isAnimating={false}
        />
      );
      
      // Performance tracking should be called during render
      await waitFor(() => {
        expect(trackComponentRender).toHaveBeenCalled();
      });
    });
  });

  describe('Render performance under load', () => {
    it('should handle rapid prop changes efficiently', async () => {
      const startTime = performance.now();
      
      const TestComponent = ({ index }: { index: number }) => (
        <QuestionCard
          question={mockQuestion}
          currentIndex={index}
          totalQuestions={100}
          isAnimating={false}
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

    it('should handle large question lists efficiently', () => {
      const largeQuestionList = Array.from({ length: 100 }, (_, i) => ({
        ...mockQuestion,
        id: `question-${i}`,
        question_text: `Question ${i + 1}`,
        question_order: i + 1
      }));

      const startTime = performance.now();
      
      render(
        <FlashcardInterface
          questions={largeQuestionList}
          isOpen={true}
          onClose={jest.fn()}
          topicTitle="Performance Test"
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render large list in reasonable time (< 50ms)
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Memory leak prevention', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <FlashcardInterface
          questions={[mockQuestion]}
          isOpen={true}
          onClose={jest.fn()}
          topicTitle="Test"
        />
      );
      
      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removedListeners = removeEventListenerSpy.mock.calls.length;
      
      // Should remove at least as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should not create memory leaks with frequent re-renders', () => {
      const TestComponent = ({ count }: { count: number }) => (
        <NavigationControls
          currentIndex={count % 10}
          totalQuestions={10}
          onPrevious={jest.fn()}
          onNext={jest.fn()}
          onClose={jest.fn()}
        />
      );

      const { rerender, unmount } = render(<TestComponent count={0} />);
      
      // Simulate many re-renders
      for (let i = 1; i < 1000; i++) {
        rerender(<TestComponent count={i} />);
      }
      
      // Should not throw or cause memory issues
      expect(() => unmount()).not.toThrow();
    });
  });
});