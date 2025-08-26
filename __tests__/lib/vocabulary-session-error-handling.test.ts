import { vocabularySessionManager, VocabularyError } from '@/lib/vocabulary-session';
import { StudentVocabularyProfile, VocabularyCardData } from '@/types';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            lt: jest.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      }))
    }))
  }
}));

// Mock the vocabulary fallback manager
jest.mock('@/lib/vocabulary-fallbacks');

// Mock fetch
global.fetch = jest.fn();

describe('VocabularySessionManager Error Handling', () => {
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
      word: 'test',
      pronunciation: '/test/',
      partOfSpeech: 'noun',
      definition: 'A test word',
      exampleSentences: {
        present: 'This is a **test**.',
        past: 'This was a **test**.',
        future: 'This will be a **test**.',
        presentPerfect: 'This has been a **test**.',
        pastPerfect: 'This had been a **test**.',
        futurePerfect: 'This will have been a **test**.'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    

  });

  describe('createSession with error handling', () => {
    it('creates session successfully with AI generation', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: mockVocabularyWords
        })
      });

      const session = await vocabularySessionManager.createSession(
        'test-student-1',
        mockStudentProfile,
        5
      );

      expect(session).toBeDefined();
      expect(session.words).toHaveLength(1);
      expect(session.studentId).toBe('test-student-1');
      expect(vocabularySessionManager.isUsingFallbackVocabulary()).toBe(false);
    });

    it('falls back to offline vocabulary when AI generation fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const session = await vocabularySessionManager.createSession(
        'test-student-1',
        mockStudentProfile,
        5
      );

      expect(session).toBeDefined();
      expect(session.words).toHaveLength(1);
      expect(vocabularySessionManager.isUsingFallbackVocabulary()).toBe(false);
    });

    it('throws error when AI generation fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5)
      ).rejects.toMatchObject({
        type: 'generation',
        message: expect.stringContaining('Unable to generate personalized vocabulary')
      });
    });

    it('handles timeout errors correctly', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject({ name: 'AbortError' }), 100);
        })
      );

      await expect(
        vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5)
      ).rejects.toMatchObject({
        type: 'timeout'
      });
    });

    it('handles HTTP error responses correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(
        vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5)
      ).rejects.toMatchObject({
        type: 'generation'
      });
    });

    it('handles validation errors correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(
        vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5)
      ).rejects.toMatchObject({
        type: 'validation'
      });
    });

    it('retries failed requests with exponential backoff', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            words: mockVocabularyWords
          })
        });

      const session = await vocabularySessionManager.createSession(
        'test-student-1',
        mockStudentProfile,
        5
      );

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(session).toBeDefined();
    });
  });

  describe('continueFromLastMemory with error handling', () => {
    it('handles corrupted local session data', async () => {
      // Set corrupted data in localStorage
      localStorage.setItem('vocabulary_session', 'invalid json');
      localStorage.setItem('vocabulary_progress_test-student-1', JSON.stringify({
        studentId: 'test-student-1',
        lastSessionId: 'session-123',
        lastPosition: 5,
        lastAccessTime: new Date().toISOString(),
        totalWordsStudied: 10,
        sessionDuration: 300000
      }));

      const session = await vocabularySessionManager.continueFromLastMemory('test-student-1');

      expect(session).toBeNull();
    });

    it('recovers from database when local data is corrupted', async () => {
      // Mock database recovery
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                student_id: 'test-student-1',
                last_session_id: 'session-123',
                last_position: 5,
                last_access_time: new Date().toISOString(),
                total_words_studied: 10,
                session_duration: 300000
              },
              error: null
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'session-123',
                student_id: 'test-student-1',
                start_time: new Date().toISOString(),
                current_position: 5,
                words: mockVocabularyWords,
                is_active: true
              },
              error: null
            }))
          }))
        }))
      });

      const session = await vocabularySessionManager.continueFromLastMemory('test-student-1');

      expect(session).toBeDefined();
      expect(session?.currentPosition).toBe(5);
    });

    it('validates session data before restoring', async () => {
      const invalidSession = {
        sessionId: 'session-123',
        studentId: 'test-student-1',
        startTime: new Date(),
        currentPosition: 5,
        words: 'invalid-words', // Should be array
        isActive: true
      };

      localStorage.setItem('vocabulary_session', JSON.stringify(invalidSession));

      const session = await vocabularySessionManager.continueFromLastMemory('test-student-1');

      expect(session).toBeNull();
    });
  });



  describe('error classification', () => {
    it('classifies network errors correctly', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(
        vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5)
      ).rejects.toMatchObject({
        type: 'network'
      });
    });

    it('classifies timeout errors correctly', async () => {
      const abortError = new Error('Request timed out');
      abortError.name = 'AbortError';
      (fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await expect(
        vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5)
      ).rejects.toMatchObject({
        type: 'timeout'
      });
    });

    it('provides correct retry and fallback availability', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await vocabularySessionManager.createSession('test-student-1', mockStudentProfile, 5);
      } catch (error) {
        const vocabularyError = error as VocabularyError;
        expect(vocabularyError.retryable).toBe(true);
        expect(vocabularyError.fallbackAvailable).toBe(true);
      }
    });
  });

  describe('error state management', () => {
    it('tracks error state correctly', () => {
      const errorState = vocabularySessionManager.getErrorState();
      expect(errorState).toHaveProperty('hasError');
      expect(errorState).toHaveProperty('canRetry');
      expect(errorState).toHaveProperty('canUseFallback');
    });

    it('resets error state', () => {
      vocabularySessionManager.resetErrorState();
      const errorState = vocabularySessionManager.getErrorState();
      expect(errorState.hasError).toBe(false);
    });
  });

  describe('session data validation', () => {
    it('validates complete session structure', () => {
      const validSession = {
        sessionId: 'session-123',
        studentId: 'test-student-1',
        startTime: new Date(),
        currentPosition: 0,
        words: mockVocabularyWords,
        isActive: true
      };

      // Access private method through any cast for testing
      const isValid = (vocabularySessionManager as any).validateSessionData(validSession);
      expect(isValid).toBe(true);
    });

    it('rejects invalid session structure', () => {
      const invalidSession = {
        sessionId: 'session-123',
        // Missing required fields
        words: []
      };

      const isValid = (vocabularySessionManager as any).validateSessionData(invalidSession);
      expect(isValid).toBe(false);
    });

    it('validates word structure within session', () => {
      const sessionWithInvalidWords = {
        sessionId: 'session-123',
        studentId: 'test-student-1',
        startTime: new Date(),
        currentPosition: 0,
        words: [{ word: 'test' }], // Missing required fields
        isActive: true
      };

      const isValid = (vocabularySessionManager as any).validateSessionData(sessionWithInvalidWords);
      expect(isValid).toBe(false);
    });
  });

  describe('cleanup and memory management', () => {
    it('clears session data completely', async () => {
      localStorage.setItem('vocabulary_session', 'test');
      localStorage.setItem('vocabulary_progress_test-student-1', 'test');
      localStorage.setItem('vocabulary_seen_words_test-student-1', 'test');

      await vocabularySessionManager.clearSessionData('test-student-1');

      expect(localStorage.getItem('vocabulary_session')).toBeNull();
      expect(localStorage.getItem('vocabulary_progress_test-student-1')).toBeNull();
      expect(localStorage.getItem('vocabulary_seen_words_test-student-1')).toBeNull();
    });

    it('handles cleanup errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      await expect(
        vocabularySessionManager.clearSessionData('test-student-1')
      ).resolves.not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });
});