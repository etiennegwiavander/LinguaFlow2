import { 
  DiscussionCache,
  getCachedTopics,
  setCachedTopics,
  getCachedQuestions,
  setCachedQuestions,
  invalidateTopicsCache,
  invalidateQuestionsCache 
} from '@/lib/discussion-cache'

describe('discussion-cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    DiscussionCache.clear()
  })

  describe('Topics Cache', () => {
    const mockTopics = [
      {
        id: 'topic-1',
        title: 'Travel Adventures',
        student_id: 'student-1',
        tutor_id: 'tutor-1',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    it('caches and retrieves topics correctly', () => {
      setCachedTopics('student-1', mockTopics)
      const cached = getCachedTopics('student-1')
      
      expect(cached).toEqual(mockTopics)
    })

    it('returns null for non-existent cache', () => {
      const cached = getCachedTopics('non-existent')
      
      expect(cached).toBeNull()
    })

    it('invalidates topics cache correctly', () => {
      setCachedTopics('student-1', mockTopics)
      expect(getCachedTopics('student-1')).toEqual(mockTopics)
      
      invalidateTopicsCache('student-1')
      expect(getCachedTopics('student-1')).toBeNull()
    })

    it('handles cache expiration', () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now
      Date.now = jest.fn(() => 1000)
      
      setCachedTopics('student-1', mockTopics)
      
      // Simulate 6 minutes passing (cache expires after 5 minutes)
      Date.now = jest.fn(() => 1000 + (6 * 60 * 1000))
      
      const cached = getCachedTopics('student-1')
      expect(cached).toBeNull()
      
      // Restore original Date.now
      Date.now = originalNow
    })

    it('returns valid cache within expiration time', () => {
      const originalNow = Date.now
      Date.now = jest.fn(() => 1000)
      
      setCachedTopics('student-1', mockTopics)
      
      // Simulate 3 minutes passing (within 5 minute expiration)
      Date.now = jest.fn(() => 1000 + (3 * 60 * 1000))
      
      const cached = getCachedTopics('student-1')
      expect(cached).toEqual(mockTopics)
      
      Date.now = originalNow
    })
  })

  describe('Questions Cache', () => {
    const mockQuestions = [
      {
        id: 'q1',
        topic_id: 'topic-1',
        question_text: 'What is your favorite destination?',
        question_order: 1,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    it('caches and retrieves questions correctly', () => {
      setCachedQuestions('topic-1', mockQuestions)
      const cached = getCachedQuestions('topic-1')
      
      expect(cached).toEqual(mockQuestions)
    })

    it('returns null for non-existent cache', () => {
      const cached = getCachedQuestions('non-existent')
      
      expect(cached).toBeNull()
    })

    it('invalidates questions cache correctly', () => {
      setCachedQuestions('topic-1', mockQuestions)
      expect(getCachedQuestions('topic-1')).toEqual(mockQuestions)
      
      invalidateQuestionsCache('topic-1')
      expect(getCachedQuestions('topic-1')).toBeNull()
    })

    it('handles multiple topic caches independently', () => {
      const mockQuestions2 = [
        {
          id: 'q2',
          topic_id: 'topic-2',
          question_text: 'How do you prefer to travel?',
          question_order: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      setCachedQuestions('topic-1', mockQuestions)
      setCachedQuestions('topic-2', mockQuestions2)
      
      expect(getCachedQuestions('topic-1')).toEqual(mockQuestions)
      expect(getCachedQuestions('topic-2')).toEqual(mockQuestions2)
      
      invalidateQuestionsCache('topic-1')
      
      expect(getCachedQuestions('topic-1')).toBeNull()
      expect(getCachedQuestions('topic-2')).toEqual(mockQuestions2)
    })
  })

  describe('Cache Management', () => {
    it('clears all cache data', () => {
      const mockTopics = [{ id: 'topic-1', title: 'Test' }]
      const mockQuestions = [{ id: 'q1', topic_id: 'topic-1', question_text: 'Test?' }]
      
      setCachedTopics('student-1', mockTopics)
      setCachedQuestions('topic-1', mockQuestions)
      
      expect(getCachedTopics('student-1')).toEqual(mockTopics)
      expect(getCachedQuestions('topic-1')).toEqual(mockQuestions)
      
      DiscussionCache.clear()
      
      expect(getCachedTopics('student-1')).toBeNull()
      expect(getCachedQuestions('topic-1')).toBeNull()
    })

    it('handles cache size limits gracefully', () => {
      // Test with many cache entries to ensure no memory issues
      for (let i = 0; i < 100; i++) {
        setCachedTopics(`student-${i}`, [{ id: `topic-${i}`, title: `Topic ${i}` }])
        setCachedQuestions(`topic-${i}`, [{ id: `q-${i}`, topic_id: `topic-${i}`, question_text: `Question ${i}?` }])
      }
      
      // Verify some entries are still accessible
      expect(getCachedTopics('student-50')).toBeTruthy()
      expect(getCachedQuestions('topic-50')).toBeTruthy()
    })
  })
})