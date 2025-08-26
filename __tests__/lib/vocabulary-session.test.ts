import { VocabularySessionManager } from '@/lib/vocabulary-session';
import { VocabularyCardData, VocabularySession } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

describe('VocabularySessionManager', () => {
  let sessionManager: VocabularySessionManager;
  const mockStudentId = 'test-student-123';
  const mockWords: VocabularyCardData[] = [
    {
      word: 'hello',
      pronunciation: '/həˈloʊ/',
      partOfSpeech: 'interjection',
      definition: 'used as a greeting',
      exampleSentences: {
        present: 'I say hello to my friends.',
        past: 'I said hello yesterday.',
        future: 'I will say hello tomorrow.',
        presentPerfect: 'I have said hello many times.',
        pastPerfect: 'I had said hello before leaving.',
        futurePerfect: 'I will have said hello by then.'
      }
    },
    {
      word: 'world',
      pronunciation: '/wɜːrld/',
      partOfSpeech: 'noun',
      definition: 'the earth and all its inhabitants',
      exampleSentences: {
        present: 'The world is beautiful.',
        past: 'The world was different then.',
        future: 'The world will change.',
        presentPerfect: 'The world has evolved.',
        pastPerfect: 'The world had been simpler.',
        futurePerfect: 'The world will have transformed.'
      }
    }
  ];

  beforeEach(() => {
    sessionManager = new VocabularySessionManager();
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    sessionManager.cleanup();
  });

  describe('Session Creation', () => {
    test('should create a new vocabulary session', async () => {
      const session = await sessionManager.createSession(mockStudentId, mockWords);

      expect(session).toBeDefined();
      expect(session.studentId).toBe(mockStudentId);
      expect(session.words).toEqual(mockWords);
      expect(session.currentPosition).toBe(0);
      expect(session.isActive).toBe(true);
      expect(session.sessionId).toMatch(/^vocab_session_/);
    });

    test('should save session to localStorage on creation', async () => {
      await sessionManager.createSession(mockStudentId, mockWords);
      
      const savedSession = localStorageMock.getItem('vocabulary_session');
      expect(savedSession).toBeTruthy();
      
      const parsedSession = JSON.parse(savedSession!);
      expect(parsedSession.studentId).toBe(mockStudentId);
      expect(parsedSession.words).toEqual(mockWords);
    });
  });

  describe('Session Navigation', () => {
    beforeEach(async () => {
      await sessionManager.createSession(mockStudentId, mockWords);
    });

    test('should navigate to next word', async () => {
      const nextWord = await sessionManager.navigateNext();
      
      expect(nextWord).toEqual(mockWords[1]);
      expect(sessionManager.getCurrentSession()?.currentPosition).toBe(1);
    });

    test('should navigate to previous word', async () => {
      await sessionManager.navigateNext(); // Move to position 1
      const prevWord = await sessionManager.navigatePrevious();
      
      expect(prevWord).toEqual(mockWords[0]);
      expect(sessionManager.getCurrentSession()?.currentPosition).toBe(0);
    });

    test('should not navigate beyond bounds', async () => {
      // Try to go previous from position 0
      const prevWord = await sessionManager.navigatePrevious();
      expect(prevWord).toBeNull();
      expect(sessionManager.getCurrentSession()?.currentPosition).toBe(0);

      // Navigate to last position
      await sessionManager.navigateNext();
      
      // Try to go next from last position
      const nextWord = await sessionManager.navigateNext();
      expect(nextWord).toBeNull();
      expect(sessionManager.getCurrentSession()?.currentPosition).toBe(1);
    });

    test('should get current word correctly', async () => {
      const currentWord = sessionManager.getCurrentWord();
      expect(currentWord).toEqual(mockWords[0]);

      await sessionManager.navigateNext();
      const nextCurrentWord = sessionManager.getCurrentWord();
      expect(nextCurrentWord).toEqual(mockWords[1]);
    });
  });

  describe('Session Progress', () => {
    beforeEach(async () => {
      await sessionManager.createSession(mockStudentId, mockWords);
    });

    test('should track session progress correctly', () => {
      let progress = sessionManager.getSessionProgress();
      expect(progress).toEqual({ current: 1, total: 2, percentage: 50 });

      sessionManager.navigateNext();
      progress = sessionManager.getSessionProgress();
      expect(progress).toEqual({ current: 2, total: 2, percentage: 100 });
    });

    test('should handle empty session progress', () => {
      const emptySessionManager = new VocabularySessionManager();
      const progress = emptySessionManager.getSessionProgress();
      expect(progress).toEqual({ current: 0, total: 0, percentage: 0 });
      emptySessionManager.cleanup();
    });
  });

  describe('Seen Words Management', () => {
    test('should add and track seen words', async () => {
      await sessionManager.addSeenWord('hello', mockStudentId);
      await sessionManager.addSeenWord('world', mockStudentId);
      
      const seenWords = sessionManager.getSeenWords(mockStudentId);
      expect(seenWords).toContain('hello');
      expect(seenWords).toContain('world');
    });

    test('should not duplicate seen words', async () => {
      await sessionManager.addSeenWord('hello', mockStudentId);
      await sessionManager.addSeenWord('hello', mockStudentId);
      
      const seenWords = sessionManager.getSeenWords(mockStudentId);
      expect(seenWords.filter(word => word === 'hello')).toHaveLength(1);
    });

    test('should persist seen words in localStorage', async () => {
      await sessionManager.addSeenWord('test', mockStudentId);
      
      const savedWords = localStorageMock.getItem(`vocabulary_seen_words_${mockStudentId}`);
      expect(savedWords).toBeTruthy();
      
      const parsedWords = JSON.parse(savedWords!);
      expect(parsedWords).toContain('test');
    });
  });

  describe('Session Recovery', () => {
    test('should check if can continue from last memory', async () => {
      // Initially should return false
      const canContinue = await sessionManager.canContinueFromLastMemory(mockStudentId);
      expect(canContinue).toBe(false);
    });

    test('should recover session from localStorage', async () => {
      // Create and navigate in session
      await sessionManager.createSession(mockStudentId, mockWords);
      await sessionManager.navigateNext();
      
      // Create new session manager to simulate page refresh
      const newSessionManager = new VocabularySessionManager();
      const recoveredSession = await newSessionManager.recoverSession(mockStudentId);
      
      expect(recoveredSession).toBeTruthy();
      expect(recoveredSession?.studentId).toBe(mockStudentId);
      expect(recoveredSession?.currentPosition).toBe(1);
      
      newSessionManager.cleanup();
    });

    test('should handle session recovery failure gracefully', async () => {
      const recoveredSession = await sessionManager.recoverSession('non-existent-student');
      expect(recoveredSession).toBeNull();
    });
  });

  describe('Session Cleanup', () => {
    test('should end session properly', async () => {
      await sessionManager.createSession(mockStudentId, mockWords);
      expect(sessionManager.getCurrentSession()).toBeTruthy();
      
      await sessionManager.endSession();
      expect(sessionManager.getCurrentSession()).toBeNull();
    });

    test('should clear session data', async () => {
      await sessionManager.createSession(mockStudentId, mockWords);
      await sessionManager.addSeenWord('test', mockStudentId);
      
      await sessionManager.clearSessionData(mockStudentId);
      
      expect(localStorageMock.getItem('vocabulary_session')).toBeNull();
      expect(localStorageMock.getItem(`vocabulary_progress_${mockStudentId}`)).toBeNull();
      expect(localStorageMock.getItem(`vocabulary_seen_words_${mockStudentId}`)).toBeNull();
    });

    test('should cleanup intervals on cleanup', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      sessionManager.cleanup();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      await expect(sessionManager.createSession(mockStudentId, mockWords)).resolves.toBeDefined();
      
      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    test('should handle navigation without active session', async () => {
      const nextWord = await sessionManager.navigateNext();
      expect(nextWord).toBeNull();
      
      const prevWord = await sessionManager.navigatePrevious();
      expect(prevWord).toBeNull();
      
      const currentWord = sessionManager.getCurrentWord();
      expect(currentWord).toBeNull();
    });
  });

  describe('Session State Persistence', () => {
    test('should save progress to localStorage periodically', async () => {
      await sessionManager.createSession(mockStudentId, mockWords);
      await sessionManager.navigateNext();
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const savedProgress = localStorageMock.getItem(`vocabulary_progress_${mockStudentId}`);
      expect(savedProgress).toBeTruthy();
      
      const parsedProgress = JSON.parse(savedProgress!);
      expect(parsedProgress.lastPosition).toBe(1);
      expect(parsedProgress.studentId).toBe(mockStudentId);
    });

    test('should handle session state persistence across page refreshes', async () => {
      // Create session and navigate
      await sessionManager.createSession(mockStudentId, mockWords);
      await sessionManager.navigateNext();
      
      // Simulate page refresh by creating new session manager
      const newSessionManager = new VocabularySessionManager();
      const recoveredSession = await newSessionManager.recoverSession(mockStudentId);
      
      expect(recoveredSession?.currentPosition).toBe(1);
      expect(recoveredSession?.words).toEqual(mockWords);
      
      newSessionManager.cleanup();
    });
  });
});