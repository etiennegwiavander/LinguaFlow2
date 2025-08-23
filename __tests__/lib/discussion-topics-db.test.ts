import { 
  createDiscussionTopic, 
  getTopicsByStudentId, 
  deleteDiscussionTopic,
  checkTopicExists 
} from '@/lib/discussion-topics-db'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        ilike: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('discussion-topics-db', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDiscussionTopic', () => {
    it('creates a new discussion topic successfully', async () => {
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

      const result = await createDiscussionTopic({
        title: 'Travel Adventures',
        studentId: 'student-1',
        tutorId: 'tutor-1'
      })

      expect(result.data).toEqual(mockTopic)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_topics')
    })

    it('handles creation errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().insert().select.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await createDiscussionTopic({
        title: 'Travel Adventures',
        studentId: 'student-1',
        tutorId: 'tutor-1'
      })

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })

    it('validates topic title', async () => {
      const result = await createDiscussionTopic({
        title: '',
        studentId: 'student-1',
        tutorId: 'tutor-1'
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('title')
    })
  })

  describe('getTopicsByStudentId', () => {
    it('fetches topics for a student successfully', async () => {
      const mockTopics = [
        {
          id: 'topic-1',
          title: 'Travel Adventures',
          student_id: 'student-1',
          tutor_id: 'tutor-1',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockTopics,
        error: null
      })

      const result = await getTopicsByStudentId('student-1')

      expect(result.data).toEqual(mockTopics)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_topics')
    })

    it('handles fetch errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getTopicsByStudentId('student-1')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('deleteDiscussionTopic', () => {
    it('deletes a topic successfully', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await deleteDiscussionTopic('topic-1')

      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('discussion_topics')
    })

    it('handles deletion errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await deleteDiscussionTopic('topic-1')

      expect(result.error).toEqual(mockError)
    })
  })

  describe('checkTopicExists', () => {
    it('returns true when topic exists', async () => {
      mockSupabase.from().select().eq().ilike().limit.mockResolvedValue({
        data: [{ id: 'topic-1' }],
        error: null
      })

      const result = await checkTopicExists('Travel Adventures', 'tutor-1')

      expect(result.exists).toBe(true)
      expect(result.error).toBeNull()
    })

    it('returns false when topic does not exist', async () => {
      mockSupabase.from().select().eq().ilike().limit.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await checkTopicExists('Non-existent Topic', 'tutor-1')

      expect(result.exists).toBe(false)
      expect(result.error).toBeNull()
    })

    it('handles check errors', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from().select().eq().ilike().limit.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await checkTopicExists('Travel Adventures', 'tutor-1')

      expect(result.exists).toBe(false)
      expect(result.error).toEqual(mockError)
    })
  })
})