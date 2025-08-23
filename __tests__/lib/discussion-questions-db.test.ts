import { 
  createDiscussionQuestions, 
  getQuestionsByTopicId, 
  deleteQuestionsByTopicId,
  getQuestionsCount 
} from '@/lib/discussion-questions-db'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('discussion-questions-db', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDiscussionQuestions', () => {
    const mockQuestions = [
      {
        topic_id: 'topic-1',
        question_text: 'What is your favorite destination?',
        question_order: 1
      },
      {
        topic_id: 'topic-1',
        question_text: 'How do you prefer to travel?',
        question_order: 2
      }
    ]

    it('creates multiple questions successfully', async () => {
      mockSupabase.from().insert.mockResolvedValue({
        data: mockQuestions,
        error: null
      })

      const result = await createDiscussionQuestions(mockQuestions)

      expect(result.data).toEqual(mockQuestions)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_questions')
    })

    it('handles creation errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().insert.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await createDiscussionQuestions(mockQuestions)

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })

    it('validates questions array', async () => {
      const result = await createDiscussionQuestions([])

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('questions')
    })
  })

  describe('getQuestionsByTopicId', () => {
    it('fetches questions for a topic successfully', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          topic_id: 'topic-1',
          question_text: 'What is your favorite destination?',
          question_order: 1,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'q2',
          topic_id: 'topic-1',
          question_text: 'How do you prefer to travel?',
          question_order: 2,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockQuestions,
        error: null
      })

      const result = await getQuestionsByTopicId('topic-1')

      expect(result.data).toEqual(mockQuestions)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_questions')
    })

    it('handles fetch errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getQuestionsByTopicId('topic-1')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })

    it('returns empty array when no questions found', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await getQuestionsByTopicId('topic-1')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('deleteQuestionsByTopicId', () => {
    it('deletes questions successfully', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await deleteQuestionsByTopicId('topic-1')

      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_questions')
    })

    it('handles deletion errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await deleteQuestionsByTopicId('topic-1')

      expect(result.error).toEqual(mockError)
    })
  })

  describe('getQuestionsCount', () => {
    it('returns correct count of questions', async () => {
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [{ id: 'q1' }],
        error: null
      })

      const result = await getQuestionsCount('topic-1')

      expect(result.count).toBe(1)
      expect(result.error).toBeNull()
    })

    it('returns zero when no questions exist', async () => {
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await getQuestionsCount('topic-1')

      expect(result.count).toBe(0)
      expect(result.error).toBeNull()
    })

    it('handles count errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getQuestionsCount('topic-1')

      expect(result.count).toBe(0)
      expect(result.error).toEqual(mockError)
    })
  })
})