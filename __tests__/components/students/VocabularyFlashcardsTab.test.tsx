import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { VocabularyFlashcardsTab } from '@/components/students/VocabularyFlashcardsTab';
import { VocabularySessionManager } from '@/lib/vocabulary-session';
import { StudentVocabularyProfile, VocabularyCardData } from '@/types';

// Mock dependencies
jest.mock('@/lib/vocabulary-session');
jest.mock('@/lib/vocabulary-fallbacks');
jest.mock('@/components/students/VocabularyFlashcardInterface', () => ({
  VocabularyFlashcardInterface: ({ onClose, vocabularyData, currentIndex, onNavigate }: any) => (
    <div data-testid="vocabulary-flashcard-interface">
      <div data-testid="current-word">{vocabularyData[currentIndex]?.word}</div>
      <button onClick={() => onNavigate('next')} data-testid="next-button">Next</button>
      <button onClick={() => onNavigate('previous')} data-testid="prev-button">Previous</button>
      <button onClick={onClose} data-testid="close-button">Close</button>
    </div>
  )
}));

const mockVocabularySessionManager = VocabularySessionManager as jest.MockedClass<typeof VocabularySessionManager>;

describe('VocabularyFlashcardsTab', () => {
  const mockStudentProfile: StudentVocabularyProfile = {
    studentId: 'test-student-1',
    proficiencyLevel: 'B1',
    nativeLanguage: 'Spanish',
    learningGoals: ['business', 'travel'],
    vocabularyWeaknesses: ['technology', 'emotions'],
    conversationalBarriers: ['vocabulary'],
    seenWords: ['hello', 'goodbye']
  };

  const mockVocabularyWords: VocabularyCardData[] = [
    {
      word: 'beautiful',
      pronunciation: '/ˈbjuːtɪfʊl/',
      partOfSpeech: 'adjective',
      definition: 'Pleasing the senses or mind aesthetically',
      exampleSentences: {
        present: 'The garden is **beautiful** in spring.',
        past: 'The sunset was **beautiful** yesterday.',
        future: 'The flowers will be **beautiful** next month.',
        presentPerfect: 'The view has been **beautiful** all day.',
        pastPerfect: 'The landscape had been **beautiful** before the storm.',
        futurePerfect: 'The garden will have been **beautiful** for years by then.'
      }
    },
    {
      word: 'challenge',
      pronunciation: '/ˈtʃælɪndʒ/',
      partOfSpeech: 'noun',
      definition: 'A task or situation that tests someone\'s abilities',
      exampleSentences: {
        present: 'This **challenge** requires creativity.',
        past: 'The **challenge** was difficult yesterday.',
        future: 'The next **challenge** will be easier.',
        presentPerfect: 'This **challenge** has been rewarding.',
        pastPerfect: 'The **challenge** had been unexpected.',
        futurePerfect: 'The **challenge** will have been overcome.'
      }
    }
  ];

  const defaultProps = {
    studentProfile: mockStudentProfile,
    onError: jest.fn(),
    className: 'test-class'
  };

  let mockSessionManagerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock session manager instance
    mockSessionManagerInstance = {
      createSession: jest.fn(),
      canContinueFromLastMemory: jest.fn(),
      continueFromLastMemory: jest.fn(),
      getCurrentWord: jest.fn(),
      navigateNext: jest.fn(),
      navigatePrevious: jest.fn(),
      getSessionProgress: jest.fn(),
      endSession: jest.fn(),
      cleanup: jest.fn(),
      isUsingFallbackVocabulary: jest.fn(),
      getErrorState: jest.fn(),
      resetErrorState: jest.fn()
    };

    mockVocabularySessionManager.mockImplementation(() => mockSessionManagerInstance);
    

  });

  describe('Initial Rendering', () => {
    it('renders the main interface correctly', () => {
      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      expect(screen.getByText('Vocabulary Flashcards')).toBeInTheDocument();
      expect(screen.getByText(/personalized vocabulary practice/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument();
    });

    it('shows continue option when last memory is available', async () => {
      mockSessionManagerInstance.canContinueFromLastMemory.mockResolvedValue(true);
      
      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue from last memory/i })).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      const { container } = render(<VocabularyFlashcardsTab {...defaultProps} />);
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('Session Creation', () => {
    it('creates a new vocabulary session successfully', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.createSession.mockResolvedValue({
        sessionId: 'test-session',
        studentId: mockStudentProfile.studentId,
        words: mockVocabularyWords,
        currentPosition: 0,
        isActive: true
      });
      mockSessionManagerInstance.getCurrentWord.mockReturnValue(mockVocabularyWords[0]);
      mockSessionManagerInstance.getSessionProgress.mockReturnValue({ current: 1, total: 2, percentage: 50 });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.createSession).toHaveBeenCalledWith(
          mockStudentProfile.studentId,
          mockStudentProfile,
          10
        );
        expect(screen.getByTestId('vocabulary-flashcard-interface')).toBeInTheDocument();
      });
    });

    it('continues from last memory successfully', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.canContinueFromLastMemory.mockResolvedValue(true);
      mockSessionManagerInstance.continueFromLastMemory.mockResolvedValue({
        sessionId: 'existing-session',
        studentId: mockStudentProfile.studentId,
        words: mockVocabularyWords,
        currentPosition: 1,
        isActive: true
      });
      mockSessionManagerInstance.getCurrentWord.mockReturnValue(mockVocabularyWords[1]);
      mockSessionManagerInstance.getSessionProgress.mockReturnValue({ current: 2, total: 2, percentage: 100 });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue from last memory/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /continue from last memory/i }));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.continueFromLastMemory).toHaveBeenCalledWith(mockStudentProfile.studentId);
        expect(screen.getByTestId('vocabulary-flashcard-interface')).toBeInTheDocument();
        expect(screen.getByTestId('current-word')).toHaveTextContent('challenge');
      });
    });

    it('shows loading state during session creation', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.createSession.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          sessionId: 'test-session',
          words: mockVocabularyWords,
          currentPosition: 0
        }), 100))
      );

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      expect(screen.getByText(/generating vocabulary/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new session/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles session creation errors gracefully', async () => {
      const user = userEvent.setup();
      const error = new Error('Failed to create session');
      mockSessionManagerInstance.createSession.mockRejectedValue(error);
      mockSessionManagerInstance.getErrorState.mockReturnValue({
        hasError: true,
        canRetry: true,
        canUseFallback: true,
        errorMessage: 'Failed to create session'
      });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to create session/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /use offline vocabulary/i })).toBeInTheDocument();
      });
    });

    it('handles continue from memory errors', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.canContinueFromLastMemory.mockResolvedValue(true);
      mockSessionManagerInstance.continueFromLastMemory.mockRejectedValue(new Error('Session recovery failed'));
      mockSessionManagerInstance.getErrorState.mockReturnValue({
        hasError: true,
        canRetry: false,
        canUseFallback: true,
        errorMessage: 'Session recovery failed'
      });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue from last memory/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /continue from last memory/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/session recovery failed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument();
      });
    });

    it('retries failed operations', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.createSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          sessionId: 'retry-session',
          words: mockVocabularyWords,
          currentPosition: 0
        });
      
      mockSessionManagerInstance.getErrorState
        .mockReturnValueOnce({
          hasError: true,
          canRetry: true,
          canUseFallback: true,
          errorMessage: 'Network error'
        })
        .mockReturnValueOnce({
          hasError: false,
          canRetry: false,
          canUseFallback: false,
          errorMessage: null
        });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.createSession).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('vocabulary-flashcard-interface')).toBeInTheDocument();
      });
    });

    it('shows error message when AI generation fails', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.createSession.mockRejectedValue(new Error('AI service unavailable'));
      mockSessionManagerInstance.getErrorState.mockReturnValue({
        hasError: true,
        canRetry: true,
        canUseFallback: false,
        errorMessage: 'AI service unavailable'
      });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/ai service unavailable/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('calls onError prop when errors occur', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      mockSessionManagerInstance.createSession.mockRejectedValue(error);
      mockSessionManagerInstance.getErrorState.mockReturnValue({
        hasError: true,
        canRetry: false,
        canUseFallback: false,
        errorMessage: 'Test error'
      });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Flashcard Interface Integration', () => {
    beforeEach(async () => {
      mockSessionManagerInstance.createSession.mockResolvedValue({
        sessionId: 'test-session',
        words: mockVocabularyWords,
        currentPosition: 0
      });
      mockSessionManagerInstance.getCurrentWord.mockReturnValue(mockVocabularyWords[0]);
      mockSessionManagerInstance.getSessionProgress.mockReturnValue({ current: 1, total: 2, percentage: 50 });
    });

    it('navigates to next word correctly', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.navigateNext.mockResolvedValue(mockVocabularyWords[1]);
      mockSessionManagerInstance.getCurrentWord
        .mockReturnValueOnce(mockVocabularyWords[0])
        .mockReturnValueOnce(mockVocabularyWords[1]);

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-word')).toHaveTextContent('beautiful');
      });

      await user.click(screen.getByTestId('next-button'));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.navigateNext).toHaveBeenCalled();
        expect(screen.getByTestId('current-word')).toHaveTextContent('challenge');
      });
    });

    it('navigates to previous word correctly', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.navigatePrevious.mockResolvedValue(mockVocabularyWords[0]);
      mockSessionManagerInstance.getCurrentWord
        .mockReturnValueOnce(mockVocabularyWords[1])
        .mockReturnValueOnce(mockVocabularyWords[0]);

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('vocabulary-flashcard-interface')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('prev-button'));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.navigatePrevious).toHaveBeenCalled();
      });
    });

    it('closes flashcard interface correctly', async () => {
      const user = userEvent.setup();

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('vocabulary-flashcard-interface')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('close-button'));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.endSession).toHaveBeenCalled();
        expect(screen.queryByTestId('vocabulary-flashcard-interface')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument();
      });
    });
  });

  describe('Session State Management', () => {
    it('tracks session progress correctly', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.createSession.mockResolvedValue({
        sessionId: 'test-session',
        words: mockVocabularyWords,
        currentPosition: 0
      });
      mockSessionManagerInstance.getCurrentWord.mockReturnValue(mockVocabularyWords[0]);
      mockSessionManagerInstance.getSessionProgress.mockReturnValue({ current: 1, total: 2, percentage: 50 });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      await user.click(screen.getByRole('button', { name: /start new session/i }));
      
      await waitFor(() => {
        expect(mockSessionManagerInstance.getSessionProgress).toHaveBeenCalled();
      });
    });


  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Vocabulary Flashcards');
      expect(screen.getByRole('button', { name: /start new session/i })).toHaveAttribute('aria-describedby');
    });

    it('manages focus correctly during state transitions', async () => {
      const user = userEvent.setup();
      mockSessionManagerInstance.createSession.mockResolvedValue({
        sessionId: 'test-session',
        words: mockVocabularyWords,
        currentPosition: 0
      });

      render(<VocabularyFlashcardsTab {...defaultProps} />);
      
      const startButton = screen.getByRole('button', { name: /start new session/i });
      await user.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('vocabulary-flashcard-interface')).toBeInTheDocument();
      });
    });
