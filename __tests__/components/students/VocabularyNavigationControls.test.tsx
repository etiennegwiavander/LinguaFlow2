import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VocabularyNavigationControls } from '@/components/students/VocabularyNavigationControls';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';

// Mock the LoadingStates component
jest.mock('@/components/students/LoadingStates', () => ({
  InlineLoading: ({ size }: { size: string }) => <div data-testid="inline-loading">{size}</div>
}));

describe('VocabularyNavigationControls', () => {
  const defaultProps = {
    currentIndex: 0,
    totalWords: 5,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onClose: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  describe('Basic Rendering', () => {
    it('renders navigation controls with correct structure', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /previous vocabulary word/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next vocabulary word/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close vocabulary flashcards/i })).toBeInTheDocument();
      expect(screen.getByText('1 of 5')).toBeInTheDocument();
    });

    it('shows progress bar with correct width', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 60%'); // (2+1)/5 * 100 = 60%
      expect(progressBar).toHaveAttribute('aria-valuenow', '3');
      expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    });

    it('shows dot indicators for sessions with 10 or fewer words', () => {
      render(<VocabularyNavigationControls {...defaultProps} totalWords={8} />);
      
      const dots = screen.getAllByRole('tab');
      expect(dots).toHaveLength(8);
      expect(dots[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('does not show dot indicators for sessions with more than 10 words', () => {
      render(<VocabularyNavigationControls {...defaultProps} totalWords={15} />);
      
      const dots = screen.queryAllByRole('tab');
      expect(dots).toHaveLength(0);
    });
  });

  describe('Button States', () => {
    it('disables previous button on first word', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={0} />);
      
      const prevButton = screen.getByRole('button', { name: /previous vocabulary word/i });
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('disables next button on last word', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={4} totalWords={5} />);
      
      const nextButton = screen.getByRole('button', { name: /next vocabulary word/i });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('shows reset button when not on first word', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      expect(screen.getByRole('button', { name: /reset to first vocabulary word/i })).toBeInTheDocument();
    });

    it('hides reset button when on first word', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={0} />);
      
      expect(screen.queryByRole('button', { name: /reset to first vocabulary word/i })).not.toBeInTheDocument();
    });
  });

  describe('Loading and Animation States', () => {
    it('shows loading indicators when isLoading is true', () => {
      render(<VocabularyNavigationControls {...defaultProps} isLoading={true} />);
      
      const loadingIndicators = screen.getAllByTestId('inline-loading');
      expect(loadingIndicators).toHaveLength(2); // Previous and Next buttons
    });

    it('shows loading indicators when isAnimating is true', () => {
      render(<VocabularyNavigationControls {...defaultProps} isAnimating={true} />);
      
      const loadingIndicators = screen.getAllByTestId('inline-loading');
      expect(loadingIndicators).toHaveLength(2);
    });

    it('disables all buttons when loading', () => {
      render(<VocabularyNavigationControls {...defaultProps} isLoading={true} currentIndex={2} />);
      
      expect(screen.getByRole('button', { name: /previous vocabulary word/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next vocabulary word/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /close vocabulary flashcards/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /reset to first vocabulary word/i })).toBeDisabled();
    });
  });

  describe('Click Interactions', () => {
    it('calls onNext when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /next vocabulary word/i }));
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrevious when previous button is clicked', async () => {
      const user = userEvent.setup();
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      await user.click(screen.getByRole('button', { name: /previous vocabulary word/i }));
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /close vocabulary flashcards/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onReset when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      await user.click(screen.getByRole('button', { name: /reset to first vocabulary word/i }));
      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onNext when right arrow key is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onNext when down arrow key is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onNext when spacebar is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: ' ' });
      await waitFor(() => {
        expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onPrevious when left arrow key is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onPrevious when up arrow key is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      await waitFor(() => {
        expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose when escape key is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onReset when home key is pressed', async () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      fireEvent.keyDown(document, { key: 'Home' });
      await waitFor(() => {
        expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents keyboard navigation when isAnimating is true', async () => {
      render(<VocabularyNavigationControls {...defaultProps} isAnimating={true} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(defaultProps.onNext).not.toHaveBeenCalled();
      });
    });

    it('prevents keyboard navigation when isLoading is true', async () => {
      render(<VocabularyNavigationControls {...defaultProps} isLoading={true} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(defaultProps.onNext).not.toHaveBeenCalled();
      });
    });

    it('does not call onPrevious when on first word', async () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={0} />);
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(defaultProps.onPrevious).not.toHaveBeenCalled();
      });
    });

    it('does not call onNext when on last word', async () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={4} totalWords={5} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(defaultProps.onNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for buttons', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      expect(screen.getByRole('button', { name: /previous vocabulary word.*go to word 2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next vocabulary word.*go to word 4/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close vocabulary flashcards.*escape key/i })).toBeInTheDocument();
    });

    it('provides proper progress bar accessibility attributes', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} totalWords={5} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '3');
      expect(progressBar).toHaveAttribute('aria-valuemin', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '5');
      expect(progressBar).toHaveAttribute('aria-label', 'Vocabulary progress: 3 of 5 words');
    });

    it('provides screen reader announcements', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} totalWords={5} />);
      
      const announcement = screen.getByText(/vocabulary navigation controls.*current word 3 of 5/i);
      expect(announcement).toHaveClass('sr-only');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('provides help text for screen readers', () => {
      render(<VocabularyNavigationControls {...defaultProps} />);
      
      expect(screen.getByText(/navigate to the previous vocabulary word/i)).toBeInTheDocument();
      expect(screen.getByText(/navigate to the next vocabulary word/i)).toBeInTheDocument();
      expect(screen.getByText(/close the vocabulary flashcard interface/i)).toBeInTheDocument();
      
      // Check that the parent container has sr-only class
      const helpContainer = screen.getByText(/navigate to the previous vocabulary word/i).parentElement;
      expect(helpContainer).toHaveClass('sr-only');
    });
  });

  describe('Performance Optimization', () => {
    it('uses React.memo with custom comparison', () => {
      const { rerender } = render(<VocabularyNavigationControls {...defaultProps} />);
      
      // Re-render with same props should not cause re-render
      rerender(<VocabularyNavigationControls {...defaultProps} />);
      
      // Only re-render when relevant props change
      rerender(<VocabularyNavigationControls {...defaultProps} currentIndex={1} />);
      
      // Component should be memoized (we can't easily test the memo behavior directly)
      expect(typeof VocabularyNavigationControls).toBe('object');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <VocabularyNavigationControls {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies hover and focus styles correctly', () => {
      render(<VocabularyNavigationControls {...defaultProps} currentIndex={2} />);
      
      const nextButton = screen.getByRole('button', { name: /next vocabulary word/i });
      expect(nextButton).toHaveClass('hover:scale-105', 'active:scale-95', 'focus:ring-2');
    });
  });
});