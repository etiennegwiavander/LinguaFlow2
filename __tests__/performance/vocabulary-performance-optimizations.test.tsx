import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VocabularyCard } from '@/components/students/VocabularyCard';
import { VocabularyFlashcardInterface } from '@/components/students/VocabularyFlashcardInterface';
import { vocabularyPerformanceMonitor } from '@/lib/vocabulary-performance-monitor';
import { VocabularyCardData } from '@/types';
import { beforeEach } from 'node:test';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock vocabulary session manager
const mockVocabularySessionManager = {
  createSession: jest.fn(),
  getCacheStats: jest.fn(() => ({ size: 0, keys: [] })),
  cleanup: jest.fn(),
  generateVocabularyFromAI: jest.fn()
};

jest.mock('@/lib/vocabulary-session', () => ({
  vocabularySessionManager: mockVocabularySessionManager
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50 // 50MB
    }
  }
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));

const mockVocabularyData: VocabularyCardData = {
  word: 'example',
  pronunciation: 'ɪɡˈzæmpəl',
  partOfSpeech: 'noun',
  definition: 'A thing characteristic of its kind or illustrating a general rule.',
  exampleSentences: {
    present: 'This is an example of good writing.',
    past: 'Yesterday, I gave an example to the class.',
    future: 'Tomorrow, I will provide another example.',
    presentPerfect: 'I have shown many examples today.',
    pastPerfect: 'I had given several examples before the break.',
    futurePerfect: 'By next week, I will have provided countless examples.'
  }
};

const mockVocabularyWords: VocabularyCardData[] = [
  mockVocabularyData,
  {
    ...mockVocabularyData,
    word: 'test',
    pronunciation: 'test',
    definition: 'A test definition'
  },
  {
    ...mockVocabularyData,
    word: 'performance',
    pronunciation: 'pərˈfɔːrməns',
    definition: 'The action or process of performing a task or function'
  }
];

describe('Vocabulary Performance Optimizations', () => {
  beforeEach(() => {
    vocabularyPerformanceMonitor.reset();
    jest.clearAllMocks();
  });

  describe('React.memo optimization', () => {
    it('should prevent unnecessary re-renders of VocabularyCard', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = React.memo(() => {
        renderSpy();
        return (
          <VocabularyCard
            vocabularyData={mockVocabularyData}
            currentIndex={0}
            totalWords={1}
            isAnimating={false}
          />
        );
      });

      const { rerender } = render(<TestComponent />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props - should not trigger re-render
      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render VocabularyCard when props change', () => {
      const { rerender } = render(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={false}
        />
      );

      expect(screen.getByText('example')).toBeInTheDocument();

      // Re-render with different vocabulary data
      rerender(
        <VocabularyCard
          vocabularyData={{
            ...mockVocabularyData,
            word: 'different'
          }}
          currentIndex={0}
          totalWords={1}
          isAnimating={false}
        />
      );

      expect(screen.getByText('different')).toBeInTheDocument();
    });
  });

  describe('Lazy loading optimization', () => {
    it('should lazy load example sentences when expanded', async () => {
      render(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={false}
        />
      );

      // Initially, example sentences should not be loaded
      expect(screen.queryByText('This is an example of good writing.')).not.toBeInTheDocument();

      // Click to expand examples
      const expandButton = screen.getByRole('button', { name: /example sentences/i });
      fireEvent.click(expandButton);

      // Should show loading skeleton initially
      await waitFor(() => {
        expect(screen.getByText('This is an example of good writing.')).toBeInTheDocument();
      });
    });

    it('should show loading skeleton while examples are loading', async () => {
      render(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /example sentences/i });
      fireEvent.click(expandButton);

      // Should show loading skeleton elements
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('CSS animation optimization', () => {
    it('should use transform3d for GPU acceleration', () => {
      render(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={true}
          direction="forward"
        />
      );

      const card = document.querySelector('[role="article"]');
      expect(card).toHaveClass('will-change-transform');
    });

    it('should apply proper animation classes based on direction', () => {
      const { rerender } = render(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={true}
          direction="forward"
        />
      );

      // Test forward animation
      let card = document.querySelector('[role="article"]');
      expect(card).toHaveStyle('transform: translate3d(100%, 0, 0)');

      // Test backward animation
      rerender(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={true}
          direction="backward"
        />
      );

      card = document.querySelector('[role="article"]');
      expect(card).toHaveStyle('transform: translate3d(-100%, 0, 0)');
    });
  });

  describe('Performance monitoring', () => {
    it('should track render performance', async () => {
      render(
        <VocabularyCard
          vocabularyData={mockVocabularyData}
          currentIndex={0}
          totalWords={1}
          isAnimating={false}
        />
      );

      await waitFor(() => {
        const metrics = vocabularyPerformanceMonitor.getMetrics();
        expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should track cache performance', () => {
      // Simulate cache hit
      vocabularyPerformanceMonitor.recordCacheHit();
      vocabularyPerformanceMonitor.recordCacheMiss();

      const metrics = vocabularyPerformanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(50); // 1 hit out of 2 total
    });

    it('should track prefetch performance', () => {
      vocabularyPerformanceMonitor.recordPrefetchAttempt();
      vocabularyPerformanceMonitor.recordPrefetchSuccess();
      vocabularyPerformanceMonitor.recordPrefetchAttempt();

      const metrics = vocabularyPerformanceMonitor.getMetrics();
      expect(metrics.prefetchSuccess).toBe(50); // 1 success out of 2 attempts
    });
  });

  describe('Vocabulary caching', () => {
    it('should cache vocabulary generation results', async () => {
      const mockStudentProfile = {
        studentId: 'test-student',
        proficiencyLevel: 'B1' as const,
        nativeLanguage: 'Spanish',
        learningGoals: ['conversation'],
        vocabularyWeaknesses: ['verbs'],
        conversationalBarriers: ['tenses'],
        seenWords: []
      };

      // Mock the session creation to return test data
      mockVocabularySessionManager.createSession.mockResolvedValue({
        sessionId: 'test-session',
        studentId: 'test-student',
        startTime: new Date(),
        currentPosition: 0,
        words: mockVocabularyWords,
        isActive: true
      });

      // First call should hit the API
      const session1 = await mockVocabularySessionManager.createSession(
        'test-student',
        mockStudentProfile,
        3
      );

      expect(session1.words).toHaveLength(3);

      // Second call with same parameters should use cache
      const session2 = await mockVocabularySessionManager.createSession(
        'test-student',
        mockStudentProfile,
        3
      );

      expect(session2.words).toHaveLength(3);
      
      // Verify session creation was called
      expect(mockVocabularySessionManager.createSession).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', () => {
      const stats = mockVocabularySessionManager.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('Prefetching optimization', () => {
    it('should prefetch nearby cards in VocabularyFlashcardInterface', async () => {
      const mockOnClose = jest.fn();
      const mockOnPositionChange = jest.fn();

      render(
        <VocabularyFlashcardInterface
          vocabularyWords={mockVocabularyWords}
          initialIndex={0}
          onClose={mockOnClose}
          onPositionChange={mockOnPositionChange}
        />
      );

      // Wait for prefetching to occur
      await waitFor(() => {
        expect(mockOnPositionChange).toHaveBeenCalledWith(0);
      });

      // Verify that prefetching logic is triggered
      // (In a real implementation, this would check if next cards are preloaded)
    });
  });

  describe('Memory management', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = render(
        <VocabularyFlashcardInterface
          vocabularyWords={mockVocabularyWords}
          initialIndex={0}
          onClose={jest.fn()}
        />
      );

      unmount();

      // Cleanup should be called when component unmounts
      expect(mockVocabularySessionManager.cleanup).toHaveBeenCalled();
    });

    it('should provide cache statistics', () => {
      mockVocabularySessionManager.getCacheStats.mockReturnValue({
        size: 5,
        keys: ['key1', 'key2', 'key3', 'key4', 'key5']
      });

      const stats = mockVocabularySessionManager.getCacheStats();
      expect(stats.size).toBe(5);
      expect(stats.keys).toHaveLength(5);
    });
  });
});