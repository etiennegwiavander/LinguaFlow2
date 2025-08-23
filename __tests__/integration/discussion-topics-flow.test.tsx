import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscussionTopicsTab from '@/components/students/DiscussionTopicsTab'

// Mock all dependencies
jest.mock('@/lib/discussion-topics-db')
jest.mock('@/lib/discussion-questions-db')
jest.mock('@/lib/discussion-cache')
jest.mock('@/lib/supabase')
jest.mock('sonner')

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'tutor-1' } }
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } }
      })
    }
  }
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockStudent = {
  id: 'student-1',
  name: 'John Doe',
  level: 'intermediate',
  target_language: 'en',
  tutor_id: 'tutor-1'
}

describe('Discussion Topics Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks for discussion-topics-db
    const topicsDb = require('@/lib/discussion-topics-db')
    topicsDb.getDiscussionTopicsByStudent = jest.fn().mockResolvedValue({ data: [], error: null })
    topicsDb.getPredefinedTopicsByLevel = jest.fn().mockResolvedValue({ data: [], error: null })
    topicsDb.createDiscussionTopic = jest.fn().mockResolvedValue({ 
      data: { 
        id: 'new-topic', 
        title: 'New Topic',
        student_id: 'student-1',
        tutor_id: 'tutor-1',
        is_custom: true,
        created_at: new Date().toISOString()
      }, 
      error: null 
    })
    topicsDb.deleteDiscussionTopic = jest.fn().mockResolvedValue({ error: null })
    
    // Setup default mocks for discussion-questions-db
    const questionsDb = require('@/lib/discussion-questions-db')
    questionsDb.getQuestionsByTopicId = jest.fn().mockResolvedValue({ data: [], error: null })
    questionsDb.checkQuestionsExistWithCount = jest.fn().mockResolvedValue({ 
      data: { exists: false, count: 0 }, 
      error: null 
    })
    questionsDb.getQuestionsWithMetadata = jest.fn().mockResolvedValue({ 
      data: { questions: [], count: 0 }, 
      error: null 
    })
    questionsDb.storeAIGeneratedQuestions = jest.fn().mockResolvedValue({ 
      data: [
        {
          id: 'q1',
          topic_id: 'new-topic',
          question_text: 'Generated question 1?',
          question_order: 1,
          difficulty_level: 'intermediate',
          created_at: new Date().toISOString()
        }
      ], 
      error: null 
    })
    
    // Setup cache mocks
    const cache = require('@/lib/discussion-cache')
    cache.getQuestionsCache = jest.fn().mockReturnValue(null)
    cache.setQuestionsCache = jest.fn()
    cache.shouldRefreshQuestions = jest.fn().mockReturnValue(false)
    cache.updateTopicMetadata = jest.fn()
    cache.clearExpiredEntries = jest.fn()
    
    // Mock fetch for AI generation
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        questions: [
          { question_text: 'Generated question 1?', difficulty_level: 'intermediate', question_order: 1 }
        ]
      })
    })
  })

  it('completes full topic selection and question generation flow', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    const questionsDb = require('@/lib/discussion-questions-db')
    
    // Mock existing topics
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [{
        id: 'travel-topic',
        title: 'Travel Adventures',
        student_id: 'student-1',
        tutor_id: 'tutor-1',
        is_custom: true,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Wait for topics to load
    await waitFor(() => {
      expect(screen.getByText('Travel Adventures')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Step 1: Select a topic to generate questions
    const topicCard = screen.getByText('Travel Adventures')
    fireEvent.click(topicCard)
    
    // Verify question generation flow starts
    await waitFor(() => {
      expect(questionsDb.checkQuestionsExistWithCount).toHaveBeenCalledWith('travel-topic')
    })
    
    // Verify AI generation is called since no questions exist
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/generate-discussion-questions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('travel-topic')
        })
      )
    })
    
    // Verify questions are stored
    await waitFor(() => {
      expect(questionsDb.storeAIGeneratedQuestions).toHaveBeenCalledWith(
        'travel-topic',
        expect.arrayContaining([
          expect.objectContaining({
            question_text: 'Generated question 1?',
            difficulty_level: 'intermediate',
            question_order: 1
          })
        ])
      )
    })
  })

  it('loads existing topics and displays them correctly', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    
    // Setup existing topics
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [
        {
          id: 'existing-topic-1',
          title: 'Food & Cooking',
          student_id: 'student-1',
          tutor_id: 'tutor-1',
          is_custom: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'existing-topic-2',
          title: 'Custom Topic',
          student_id: 'student-1',
          tutor_id: 'tutor-1',
          is_custom: true,
          created_at: new Date().toISOString()
        }
      ],
      error: null
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Verify topics are displayed
    await waitFor(() => {
      expect(screen.getByText('Food & Cooking')).toBeInTheDocument()
      expect(screen.getByText('Custom Topic')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Verify the correct API call was made
    expect(topicsDb.getDiscussionTopicsByStudent).toHaveBeenCalledWith('student-1', 'tutor-1')
  })

  it('handles practice mode flow with existing questions', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    const questionsDb = require('@/lib/discussion-questions-db')
    
    // Setup topic with existing questions
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [{
        id: 'topic-with-questions',
        title: 'Topic with Questions',
        student_id: 'student-1',
        tutor_id: 'tutor-1',
        is_custom: false,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    // Mock that questions exist
    questionsDb.checkQuestionsExistWithCount.mockResolvedValue({
      data: { exists: true, count: 2 },
      error: null
    })
    
    questionsDb.getQuestionsWithMetadata.mockResolvedValue({
      data: {
        questions: [
          {
            id: 'q1',
            topic_id: 'topic-with-questions',
            question_text: 'What is your favorite hobby?',
            question_order: 1,
            difficulty_level: 'intermediate',
            created_at: new Date().toISOString()
          },
          {
            id: 'q2',
            topic_id: 'topic-with-questions',
            question_text: 'How do you spend weekends?',
            question_order: 2,
            difficulty_level: 'intermediate',
            created_at: new Date().toISOString()
          }
        ],
        count: 2
      },
      error: null
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Click on topic to start practice
    await waitFor(() => {
      const topicCard = screen.getByText('Topic with Questions')
      fireEvent.click(topicCard)
    }, { timeout: 3000 })
    
    // Verify questions are loaded from database
    await waitFor(() => {
      expect(questionsDb.getQuestionsWithMetadata).toHaveBeenCalledWith('topic-with-questions')
    })
    
    // Verify flashcard interface opens
    await waitFor(() => {
      expect(screen.getByText('What is your favorite hobby?')).toBeInTheDocument()
    })
  })

  it('handles error states gracefully', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    
    // Mock network error
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: null,
      error: { message: 'Network error: Failed to load topics' }
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Should show error fallback UI
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})