import { 
  createDiscussionTopic, 
  getTopicsByStudentId, 
  deleteDiscussionTopic 
} from '@/lib/discussion-topics-db'
import { 
  createDiscussionQuestions, 
  getQuestionsByTopicId, 
  deleteQuestionsByTopicId 
} from '@/lib/discussion-questions-db'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
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

describe('Database Operations Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Topic and Questions Lifecycle', () => {
    it('creates topic and associated questions in sequence', async () => {
      // Mock topic creation
      const mockTopic = {
        id: 'topic-1',
        title: 'Travel Adventures',
        student_id: 'student-1',
        tutor_id: 'tutor-1',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from().insert().select.mockResolvedValue({
        data: [mockTopic],
        error: null
      })

      // Step 1: Create topic
      const topicResult = await createDiscussionTopic({
        title: 'Travel Adventures',
        studentId: 'student-1',
        tutorId: 'tutor-1'
      })

      expect(topicResult.data).toEqual(mockTopic)
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_topics')

      // Mock questions creation
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

      mockSupabase.from().insert.mockResolvedValue({
        data: mockQuestions,
        error: null
      })

      // Step 2: Create questions for the topic
      const questionsResult = await createDiscussionQuestions([
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
      ])

      expect(questionsResult.data).toEqual(mockQuestions)
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_questions')
    })

    it('handles cascading deletion of topic and questions', async () => {
      // Mock questions deletion
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock topic deletion
      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Step 1: Delete questions first
      const questionsDeleteResult = await deleteQuestionsByTopicId('topic-1')
      expect(questionsDeleteResult.error).toBeNull()

      // Step 2: Delete topic
      const topicDeleteResult = await deleteDiscussionTopic('topic-1')
      expect(topicDeleteResult.error).toBeNull()

      // Verify both delete operations were called
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_questions')
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_topics')
    })

    it('maintains data consistency during concurrent operations', async () => {
      const mockTopics = [
        {
          id: 'topic-1',
          title: 'Travel',
          student_id: 'student-1',
          tutor_id: 'tutor-1',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'topic-2',
          title: 'Food',
          student_id: 'student-1',
          tutor_id: 'tutor-1',
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockTopics,
        error: null
      })

      // Simulate concurrent topic fetching
      const [result1, result2] = await Promise.all([
        getTopicsByStudentId('student-1'),
        getTopicsByStudentId('student-1')
      ])

      expect(result1.data).toEqual(mockTopics)
      expect(result2.data).toEqual(mockTopics)
      expect(result1.error).toBeNull()
      expect(result2.error).toBeNull()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('handles database connection errors gracefully', async () => {
      const connectionError = { 
        message: 'Connection timeout',
        code: 'CONNECTION_ERROR'
      }

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: connectionError
      })

      const result = await getTopicsByStudentId('student-1')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(connectionError)
    })

    it('handles constraint violations during creation', async () => {
      const constraintError = {
        message: 'Duplicate key violation',
        code: '23505'
      }

      mockSupabase.from().insert().select.mockResolvedValue({
        data: null,
        error: constraintError
      })

      const result = await createDiscussionTopic({
        title: 'Duplicate Topic',
        studentId: 'student-1',
        tutorId: 'tutor-1'
      })

      expect(result.data).toBeNull()
      expect(result.error).toEqual(constraintError)
    })

    it('handles partial failures in batch operations', async () => {
      const partialError = {
        message: 'Some questions failed to insert',
        details: 'Question 2 violates constraints'
      }

      mockSupabase.from().insert.mockResolvedValue({
        data: [
          {
            id: 'q1',
            topic_id: 'topic-1',
            question_text: 'Question 1',
            question_order: 1
          }
        ],
        error: partialError
      })

      const result = await createDiscussionQuestions([
        {
          topic_id: 'topic-1',
          question_text: 'Question 1',
          question_order: 1
        },
        {
          topic_id: 'topic-1',
          question_text: 'Invalid Question',
          question_order: 2
        }
      ])

      expect(result.data).toHaveLength(1)
      expect(result.error).toEqual(partialError)
    })
  })

  describe('Data Validation and Integrity', () => {
    it('validates required fields before database operations', async () => {
      // Test topic creation with missing fields
      await expect(createDiscussionTopic({
        title: '',
        studentId: 'student-1',
        tutorId: 'tutor-1'
      })).resolves.toMatchObject({
        error: expect.objectContaining({
          message: expect.stringContaining('title')
        })
      })

      // Test questions creation with invalid data
      await expect(createDiscussionQuestions([
        {
          topic_id: '',
          question_text: 'Valid question?',
          question_order: 1
        }
      ])).resolves.toMatchObject({
        error: expect.objectContaining({
          message: expect.stringContaining('topic_id')
        })
      })
    })

    it('maintains referential integrity between topics and questions', async () => {
      // Mock questions fetch for non-existent topic
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await getQuestionsByTopicId('non-existent-topic')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('handles large datasets efficiently', async () => {
      // Mock large dataset
      const largeTopicSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `topic-${i}`,
        title: `Topic ${i}`,
        student_id: 'student-1',
        tutor_id: 'tutor-1',
        created_at: '2024-01-01T00:00:00Z'
      }))

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: largeTopicSet,
        error: null
      })

      const startTime = Date.now()
      const result = await getTopicsByStudentId('student-1')
      const endTime = Date.now()

      expect(result.data).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})