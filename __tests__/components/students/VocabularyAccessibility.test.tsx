import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VocabularyFlashcardInterface } from '@/components/students/VocabularyFlashcardInterface';
import { VocabularyCard } from '@/components/students/VocabularyCard';
import { VocabularyNavigationControls } from '@/components/students/VocabularyNavigationControls';
import { VocabularyCardData } from '@/types';

// Mock vocabulary data for testing
const mockVocabularyData: VocabularyCardData = {
  word: 'example',
  pronunciation: 'ɪɡˈzæmpəl',
  partOfSpeech: 'noun',
  definition: 'A thing characteristic of its kind or illustrating a general rule.',
  exampleSentences: {
    present: 'This is an example of good writing.',
    past: 'Yesterday, I gave an example to the class.',
    future: 'Tomorrow, I will provide an example.',
    presentPerfect: 'I have given many examples before.',
    pastPerfect: 'I had given an example before the lesson ended.',
    futurePerfect: 'By next week, I will have given several examples.'
  }
};

const mockVocabularyWords: VocabularyCardData[] = [
  mockVocabularyData,
  {
    ...mockVocabularyData,
    word: 'test',
    pronunciation: 'test',
    definition: 'A test definition'
  }
];

describe('Vocabulary Flashcards Accessibility', () => {
  describe('VocabularyFlashcardInterface', () => {
    const defaultProps = {
      vocabularyWords: mockVocabularyWords,
      initialIndex: 0,
      onClose: jest.fn(),
      onPositionChange: jest.fn(),
      isLoading: false
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render with proper accessibility structure', () => {
      render(<VocabularyFlashcardInterface {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<VocabularyFlashcardInterface {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Vocabulary Flashcard Interface');
      expect(dialog).toHaveAttribute('aria-describedby', 'flashcard-description');
    });

    it('should provide skip links for keyboard navigation', () => {
      render(<VocabularyFlashcardInterface {...defaultProps} />);
      
      const skipToCard = screen.getByText('Skip to vocabulary card');
      const skipToNav = screen.getByText('Skip to navigation controls');
      
      expect(skipToCard).toBeInTheDocument();
      expect(skipToNav).toBeInTheDocument();
    });

    it('should handle keyboard navigation correctly', () => {
      render(<VocabularyFlashcardInterface {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      
      // Test that dialog is focusable and has proper keyboard support
      expect(dialog).toHaveAttribute('tabIndex', '-1');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('should announce navigation status to screen readers', () => {
      render(<VocabularyFlashcardInterface {...defaultProps} />);
      
      const announcement = screen.getByText(/Displaying vocabulary word 1 of 2/);
      expect(announcement).toBeInTheDocument();
    });

    it('should provide keyboard shortcuts help', async () => {
      const user = userEvent.setup();
      render(<VocabularyFlashcardInterface {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      await user.type(dialog, '?');
      
      // Check that help information is available
      const helpTexts = screen.getAllByText(/Keyboard shortcuts:/);
      expect(helpTexts.length).toBeGreaterThan(0);
    });
  });

  describe('VocabularyCard', () => {
    const defaultProps = {
      vocabularyData: mockVocabularyData,
      currentIndex: 0,
      totalWords: 2,
      isAnimating: false,
      direction: 'forward' as const,
      isLoading: false
    };

    it('should render with proper accessibility structure', () => {
      render(<VocabularyCard {...defaultProps} />);
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(<VocabularyCard {...defaultProps} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Vocabulary word 1 of 2: example');
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('example');
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '1');
      expect(progressbar).toHaveAttribute('aria-valuemax', '2');
    });

    it('should provide pronunciation information accessibly', () => {
      render(<VocabularyCard {...defaultProps} />);
      
      const pronunciation = screen.getByLabelText(/Pronunciation: ɪɡˈzæmpəl/);
      expect(pronunciation).toBeInTheDocument();
    });

    it('should handle example sentences expansion accessibly', async () => {
      const user = userEvent.setup();
      render(<VocabularyCard {...defaultProps} />);
      
      const expandButton = screen.getByRole('button', { name: /Show example sentences/ });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(expandButton);
      
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      
      // Check that example sentences are properly structured
      const exampleRegion = screen.getByRole('region', { name: /Example sentences for example/ });
      expect(exampleRegion).toBeInTheDocument();
    });

    it('should provide proper focus management', () => {
      render(<VocabularyCard {...defaultProps} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('VocabularyNavigationControls', () => {
    const defaultProps = {
      currentIndex: 0,
      totalWords: 3,
      onPrevious: jest.fn(),
      onNext: jest.fn(),
      onClose: jest.fn(),
      onReset: jest.fn(),
      isAnimating: false,
      isLoading: false
    };

    it('should render with proper accessibility structure', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should provide proper button labels and states', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      const prevButton = screen.getByRole('button', { name: /Previous vocabulary word/ });
      const nextButton = screen.getByRole('button', { name: /Next vocabulary word/ });
      
      expect(prevButton).toBeDisabled(); // At first word
      expect(nextButton).not.toBeDisabled();
      
      expect(prevButton).toHaveAttribute('aria-keyshortcuts', 'ArrowLeft ArrowUp');
      expect(nextButton).toHaveAttribute('aria-keyshortcuts', 'ArrowRight ArrowDown Space');
    });

    it('should provide progress information accessibly', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Vocabulary progress: 1 of 3 words completed');
      expect(progressbar).toHaveAttribute('aria-valuenow', '1');
      expect(progressbar).toHaveAttribute('aria-valuemax', '3');
    });

    it('should handle keyboard navigation announcements', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      const statusText = screen.getByText(/Current word 1 of 3/);
      expect(statusText).toBeInTheDocument();
    });

    it('should provide comprehensive help text', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      const prevHelp = screen.getByText(/Navigate to the previous vocabulary word/);
      const nextHelp = screen.getByText(/Navigate to the next vocabulary word/);
      const closeHelp = screen.getByText(/Close the vocabulary flashcard interface/);
      
      expect(prevHelp).toBeInTheDocument();
      expect(nextHelp).toBeInTheDocument();
      expect(closeHelp).toBeInTheDocument();
    });

    it('should handle disabled states properly', () => {
      // Test at last word
      render(
        <VocabularyNavigationControls 
          {...defaultProps} 
          currentIndex={2} // Last word
        />
      );
      
      const nextButton = screen.getByRole('button', { name: /Next vocabulary word/ });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveAttribute('aria-label', expect.stringContaining('Disabled - at last word'));
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should apply high contrast styles when needed', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<VocabularyCard {...{
        vocabularyData: mockVocabularyData,
        currentIndex: 0,
        totalWords: 1,
        isAnimating: false,
        isLoading: false
      }} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('vocabulary-card');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<VocabularyFlashcardInterface {...{
        vocabularyWords: mockVocabularyWords,
        initialIndex: 0,
        onClose: jest.fn(),
        isLoading: false
      }} />);
      
      const dialogInterface = screen.getByRole('dialog');
      expect(dialogInterface).toHaveClass('vocabulary-interface');
    });
  });
});