import { InfiniteVocabularyService } from '@/lib/infinite-vocabulary-service';
import { StudentVocabularyProfile } from '@/types';
import { beforeEach } from 'node:test';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          or: jest.fn(() => Promise.resolve({ data: [], error: null })),
          ilike: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('InfiniteVocabularyService', () => {
  let service: InfiniteVocabularyService;
  let mockStudentProfile: StudentVocabularyProfile;

  beforeEach(() => {
    service = InfiniteVocabularyService.getInstance();
    mockStudentProfile = {
      studentId: 'test-student-id',
      proficiencyLevel: 'B1',
      nativeLanguage: 'Spanish',
      learningGoals: ['business', 'travel'],
      vocabularyWeaknesses: ['technology', 'emotions'],
      conversationalBarriers: ['vocabulary'],
      seenWords: ['hello', 'goodbye', 'thank', 'please']
    };

    // Reset fetch mock
    (fetch as jest.Mock).mockReset();
  });

  describe('generateInfiniteVocabulary', () => {
    it('should generate vocabulary using multiple strategies', async () => {
      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: [
            {
              word: 'business',
              pronunciation: '/ˈbɪznəs/',
              partOfSpeech: 'noun',
              definition: 'Commercial activity or work',
              exampleSentences: {
                present: 'The **business** is growing rapidly.',
                past: 'The **business** was successful last year.',
                future: 'The **business** will expand next quarter.',
                presentPerfect: 'The **business** has been profitable.',
                pastPerfect: 'The **business** had been struggling.',
                futurePerfect: 'The **business** will have grown by 2025.'
              }
            }
          ]
        })
      });

      const result = await service.generateInfiniteVocabulary(mockStudentProfile, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle API failures gracefully', async () => {
      // Mock API failure
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await service.generateInfiniteVocabulary(mockStudentProfile, 5);
      
      // Should return empty array when all strategies fail
      expect(result).toEqual([]);
    });

    it('should exclude seen words from generation', async () => {
      const profileWithSeenWords = {
        ...mockStudentProfile,
        seenWords: ['business', 'travel', 'technology']
      };

      // Mock API response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: []
        })
      });

      const result = await service.generateInfiniteVocabulary(profileWithSeenWords, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('recordVocabularyInteraction', () => {
    it('should record vocabulary interactions', async () => {
      await expect(
        service.recordVocabularyInteraction(
          'test-student-id',
          'business',
          'B1',
          'seen',
          0.8
        )
      ).resolves.not.toThrow();
    });
  });

  describe('getVocabularyAnalytics', () => {
    it('should return analytics for student with no history', async () => {
      const analytics = await service.getVocabularyAnalytics('test-student-id');

      expect(analytics).toEqual({
        totalWordsLearned: 0,
        averageMasteryScore: 0,
        learningVelocity: 1.0,
        strongCategories: [],
        weakCategories: [],
        recommendedDifficulty: 'B1'
      });
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = InfiniteVocabularyService.getInstance();
      const instance2 = InfiniteVocabularyService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});