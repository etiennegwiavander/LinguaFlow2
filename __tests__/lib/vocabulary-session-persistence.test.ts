import { VocabularySessionManager } from '@/lib/vocabulary-session';
import { VocabularyCardData, VocabularySession } from '@/types';
import { supabase } from '@/lib/supabase';

const mockSupabaseFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Default mock implementation
const createMockChain = () => ({
  upsert: jest.fn(() => ({ error: null })),
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(() => ({ data: null, error: null })),
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: null, error: null })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => ({ data: null, error: null }))
          }))
        })),
        lt: jest.fn(() => ({ error: null }))
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      }))
    }))
  })),
  delete: jest.fn(() => ({
    eq: jest.fn(() => ({
      eq: jest.fn(() => ({
        lt: jest.fn(() => ({ error: null }))
      }))
    }))
  }))
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('VocabularySessionManager - Session Persistence', () => {
  let sessionManager: VocabularySessionManager;
  const mockStudentId = 'test-student-id';
  const mockVocabularyWords: VocabularyCardData[] = [
    {
      word: 'test',
      pronunciation: '/test/',
      partOfSpeech: 'noun',
      definition: 'A test word',
      exampleSentences: {
        present: 'This is a test.',
        past: 'This was a test.',
        future: 'This will be a test.',
        presentPerfect: 'This has been a test.',
        pastPerfect: 'This had been a test.',
        futurePerfect: 'This will have been a test.'
      }
    }
  ];

  beforeEach(() => {
    sessionManager = new VocabularySessionManager();
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockSupabaseFrom.mockReturnValue(createMockChain());
  });

  afterEach(() => {
    sessionManager.cleanup();
  });

  describe('Session Creation and Persistence', () => {
    it('should create a session and save to both localStorage and database', async () => {
      const session = await sessionManager.createSession(mockStudentId, mockVocabularyWords);

      expect(session).toBeDefined();
      expect(session.studentId).toBe(mockStudentId);
      expect(session.words).toEqual(mockVocabularyWords);
      expect(session.isActive).toBe(true);
      expect(session.currentPosition).toBe(0);

      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vocabulary_session',
        expect.stringContaining(mockStudentId)
      );

      // Verify database was called
      expect(mockSupabaseFrom).toHaveBeenCalledWith('vocabulary_sessions');
    });

    it('should save progress to database periodically', async () => {
      const session = await sessionManager.createSession(mockStudentId, mockVocabularyWords);
      
      // Navigate to trigger progress update
      await sessionManager.navigateNext();

      expect(mockSupabaseFrom).toHaveBeenCalledWith('vocabulary_sessions');
    });
  });

  describe('Session Recovery', () => {
    it('should recover session from localStorage when available', async () => {
      const mockSession = {
        sessionId: 'test-session-id',
        studentId: mockStudentId,
        startTime: new Date().toISOString(),
        currentPosition: 2,
        words: mockVocabularyWords,
        isActive: true
      };

      const mockProgress = {
        studentId: mockStudentId,
        lastSessionId: 'test-session-id',
        lastPosition: 2,
        lastAccessTime: new Date().toISOString(),
        totalWordsStudied: 3,
        sessionDuration: 60000
      };

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(mockSession))
        .mockReturnValueOnce(JSON.stringify(mockProgress));

      const recoveredSession = await sessionManager.recoverSession(mockStudentId);

      expect(recoveredSession).toBeDefined();
      expect(recoveredSession?.currentPosition).toBe(2);
      expect(recoveredSession?.studentId).toBe(mockStudentId);
    });

    it('should fall back to database when localStorage is unavailable', async () => {
      const mockDbProgress = {
        student_id: mockStudentId,
        last_session_id: 'db-session-id',
        last_position: 1,
        last_access_time: new Date().toISOString(),
        total_words_studied: 2,
        session_duration: 30000
      };

      const mockDbSession = {
        id: 'db-session-id',
        student_id: mockStudentId,
        start_time: new Date().toISOString(),
        current_position: 1,
        words: mockVocabularyWords,
        is_active: true
      };

      // Mock database responses
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vocabulary_progress') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockDbProgress, error: null })
              })
            })
          };
        }
        if (table === 'vocabulary_sessions') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockDbSession, error: null }),
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => ({ data: mockDbSession, error: null })
                    })
                  })
                })
              })
            })
          };
        }
        return createMockChain();
      });

      localStorageMock.getItem.mockReturnValue(null);

      const recoveredSession = await sessionManager.recoverSession(mockStudentId);

      expect(recoveredSession).toBeDefined();
      expect(recoveredSession?.currentPosition).toBe(1);
      expect(recoveredSession?.studentId).toBe(mockStudentId);
    });
  });

  describe('Cross-Device Session Continuity', () => {
    it('should check if user can continue from last memory', async () => {
      const recentTime = new Date();
      const mockProgress = {
        studentId: mockStudentId,
        lastSessionId: 'test-session-id',
        lastPosition: 1,
        lastAccessTime: recentTime.toISOString(),
        totalWordsStudied: 2,
        sessionDuration: 30000
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProgress));

      const canContinue = await sessionManager.canContinueFromLastMemory(mockStudentId);

      expect(canContinue).toBe(true);
    });

    it('should return false for expired sessions', async () => {
      const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const mockProgress = {
        studentId: mockStudentId,
        lastSessionId: 'test-session-id',
        lastPosition: 1,
        lastAccessTime: expiredTime.toISOString(),
        totalWordsStudied: 2,
        sessionDuration: 30000
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProgress));
      
      // Mock database to return null for expired sessions
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: null })
          })
        })
      });

      const canContinue = await sessionManager.canContinueFromLastMemory(mockStudentId);

      expect(canContinue).toBe(false);
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up old sessions from database', async () => {
      await sessionManager.cleanupOldSessions(mockStudentId);

      expect(mockSupabaseFrom).toHaveBeenCalledWith('vocabulary_sessions');
    });

    it('should clear session data for student', async () => {
      await sessionManager.clearSessionData(mockStudentId);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vocabulary_session');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`vocabulary_progress_${mockStudentId}`);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`vocabulary_seen_words_${mockStudentId}`);
    });

    it('should save progress during cleanup', async () => {
      await sessionManager.createSession(mockStudentId, mockVocabularyWords);
      
      sessionManager.cleanup();

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Session Statistics', () => {
    it('should get session statistics', async () => {
      const mockSessionsData = [
        {
          start_time: new Date().toISOString(),
          current_position: 5,
          words: mockVocabularyWords
        }
      ];

      const mockProgressData = {
        total_words_studied: 10,
        session_duration: 120000,
        last_access_time: new Date().toISOString()
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'vocabulary_sessions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({ data: mockSessionsData, error: null })
                })
              })
            })
          };
        }
        if (table === 'vocabulary_progress') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockProgressData, error: null })
              })
            })
          };
        }
        return createMockChain();
      });

      const stats = await sessionManager.getSessionStatistics(mockStudentId);

      expect(stats.totalSessions).toBe(1);
      expect(stats.totalWordsStudied).toBe(10);
      expect(stats.averageSessionDuration).toBe(120000);
      expect(stats.lastSessionDate).toBeInstanceOf(Date);
    });
  });

  describe('Memory Management', () => {
    it('should handle navigation and update progress', async () => {
      const session = await sessionManager.createSession(mockStudentId, mockVocabularyWords);
      
      const nextWord = await sessionManager.navigateNext();
      
      expect(nextWord).toBeNull(); // Only one word in mock data
      expect(sessionManager.getCurrentSession()?.currentPosition).toBe(0); // Should not advance past end
    });

    it('should track seen words', async () => {
      await sessionManager.addSeenWord('testword', mockStudentId);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `vocabulary_seen_words_${mockStudentId}`,
        expect.stringContaining('testword')
      );
    });
  });
});