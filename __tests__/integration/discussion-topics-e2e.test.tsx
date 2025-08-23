/**
 * End-to-End Integration Test for Discussion Topics Feature
 * 
 * This test verifies that all components integrate properly:
 * - Student Profile displays Discussion Topics tab
 * - Topics can be loaded and displayed
 * - Question generation flow works
 * - Flashcard interface opens correctly
 * - Error handling works as expected
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DiscussionTopicsTab from '@/components/students/DiscussionTopicsTab'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-tutor-id' } },
        error: null
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      })
    }
  }
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}))

// Mock discussion topics database functions
jest.mock('@/lib/discussion-topics-db', () => ({
  getDiscussionTopicsByStudent: jest.fn(),
  getPredefinedTopicsByLevel: jest.fn(),
  createDiscussionTopic: jest.fn(),
  deleteDiscussionTopic: jest.fn()
}))

// Mock discussion questions database functions
jest.mock('@/lib/discussion-questions-db', () => ({
  checkQuestionsExistWithCount: jest.fn(),
  getQuestionsWithMetadata: jest.fn(),
  storeAIGeneratedQuestions: jest.fn()
}))

// Mock discussion cache
jest.mock('@/lib/discussion-cache', () => ({
  getQuestionsCache: jest.fn(),
  setQuestionsCache: jest.fn(),
  shouldRefreshQuestions: jest.fn(),
  updateTopicMetadata: jest.fn(),
  clearExpiredEntries: jest.fn(),
  getTopicsCache: jest.fn(),
  setTopicsCache: jest.fn(),
  invalidateTopicsCache: jest.fn()
}))

const mockStudent = {
  id: 'test-student-id',
  name: 'Test Student',
  level: 'intermediate',
  target_language: 'en',
  native_language: 'es',
  age_group: 'adult',
  end_goals: 'Improve conversation skills',
  grammar_weaknesses: 'Past tense usage',
  vocabulary_gaps: 'Business vocabulary',
  pronunciation_challenges: 'TH sounds',
  conversational_fluency_barriers: 'Speaking confidence',
  learning_styles: ['visual', 'auditory'],
  notes: 'Motivated learner'
}

describe('Discussion Topics End-to-End Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset all mocks to default successful states
    const topicsDb = require('@/lib/discussion-topics-db')
    const questionsDb = require('@/lib/discussion-questions-db')
    const cache = require('@/lib/discussion-cache')
    
    // Default: no cached topics
    cache.getTopicsCache.mockReturnValue(null)
    cache.getQuestionsCache.mockReturnValue(null)
    cache.shouldRefreshQuestions.mockReturnValue(false)
    
    // Default: empty topics from database
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({ data: [], error: null })
    topicsDb.getPredefinedTopicsByLevel.mockResolvedValue({ data: [], error: null })
    
    // Default: no existing questions
    questionsDb.checkQuestionsExistWithCount.mockResolvedValue({ 
      data: { exists: false, count: 0 }, 
      error: null 
    })
    
    // Mock successful AI generation
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        questions: Array.from({ length: 10 }, (_, i) => ({
          question_text: `Test question ${i + 1}?`,
          difficulty_level: 'intermediate',
          question_order: i + 1
        }))
      })
    })
    
    // Mock successful question storage
    questionsDb.storeAIGeneratedQuestions.mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: `q${i + 1}`,
        topic_id: 'test-topic',
        question_text: `Test question ${i + 1}?`,
        question_order: i + 1,
        difficulty_level: 'intermediate',
        created_at: new Date().toISOString()
      })),
      error: null
    })
  })

  it('renders the discussion topics tab successfully', async () => {
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Should show the main title
    expect(screen.getByText('Discussion Topics for Test Student')).toBeInTheDocument()
    
    // Should show the description
    expect(screen.getByText(/Practice conversational skills/)).toBeInTheDocument()
    
    // Should call the database functions to load topics
    await waitFor(() => {
      const topicsDb = require('@/lib/discussion-topics-db')
      expect(topicsDb.getDiscussionTopicsByStudent).toHaveBeenCalledWith(
        'test-student-id', 
        'test-tutor-id'
      )
      expect(topicsDb.getPredefinedTopicsByLevel).toHaveBeenCalledWith('intermediate')
    })
  })

  it('displays existing topics when loaded from database', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    
    // Mock topics from database
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [{
        id: 'custom-topic-1',
        title: 'My Custom Topic',
        student_id: 'test-student-id',
        tutor_id: 'test-tutor-id',
        is_custom: true,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    topicsDb.getPredefinedTopicsByLevel.mockResolvedValue({
      data: [{
        id: 'predefined-topic-1',
        title: 'Travel & Tourism',
        student_id: null,
        tutor_id: null,
        is_custom: false,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Wait for topics to load and display
    await waitFor(() => {
      expect(screen.getByText('My Custom Topic')).toBeInTheDocument()
      expect(screen.getByText('Travel & Tourism')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles topic selection and question generation flow', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    const questionsDb = require('@/lib/discussion-questions-db')
    
    // Mock a topic
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [{
        id: 'test-topic',
        title: 'Food & Cooking',
        student_id: 'test-student-id',
        tutor_id: 'test-tutor-id',
        is_custom: false,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Wait for topic to appear and click it
    await waitFor(() => {
      const topicElement = screen.getByText('Food & Cooking')
      expect(topicElement).toBeInTheDocument()
      fireEvent.click(topicElement)
    })
    
    // Should check for existing questions
    await waitFor(() => {
      expect(questionsDb.checkQuestionsExistWithCount).toHaveBeenCalledWith('test-topic')
    })
    
    // Should generate new questions via AI
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/generate-discussion-questions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test-topic')
        })
      )
    })
    
    // Should store the generated questions
    await waitFor(() => {
      expect(questionsDb.storeAIGeneratedQuestions).toHaveBeenCalledWith(
        'test-topic',
        expect.arrayContaining([
          expect.objectContaining({
            question_text: expect.stringContaining('Test question'),
            difficulty_level: 'intermediate'
          })
        ])
      )
    })
  })

  it('handles existing questions and opens flashcard interface', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    const questionsDb = require('@/lib/discussion-questions-db')
    
    // Mock topic with existing questions
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [{
        id: 'topic-with-questions',
        title: 'Technology',
        student_id: 'test-student-id',
        tutor_id: 'test-tutor-id',
        is_custom: false,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    // Mock existing questions
    questionsDb.checkQuestionsExistWithCount.mockResolvedValue({
      data: { exists: true, count: 15 },
      error: null
    })
    
    questionsDb.getQuestionsWithMetadata.mockResolvedValue({
      data: {
        questions: [
          {
            id: 'q1',
            topic_id: 'topic-with-questions',
            question_text: 'How has technology changed your daily life?',
            question_order: 1,
            difficulty_level: 'intermediate',
            created_at: new Date().toISOString()
          },
          {
            id: 'q2',
            topic_id: 'topic-with-questions',
            question_text: 'What technology do you use most often?',
            question_order: 2,
            difficulty_level: 'intermediate',
            created_at: new Date().toISOString()
          }
        ],
        count: 15
      },
      error: null
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Click on the topic
    await waitFor(() => {
      const topicElement = screen.getByText('Technology')
      fireEvent.click(topicElement)
    })
    
    // Should load existing questions instead of generating new ones
    await waitFor(() => {
      expect(questionsDb.getQuestionsWithMetadata).toHaveBeenCalledWith('topic-with-questions')
    })
    
    // Should open flashcard interface with the first question
    await waitFor(() => {
      expect(screen.getByText('How has technology changed your daily life?')).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    
    // Mock database error
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Should display error state
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles AI generation failures with fallback', async () => {
    const topicsDb = require('@/lib/discussion-topics-db')
    
    // Mock topic
    topicsDb.getDiscussionTopicsByStudent.mockResolvedValue({
      data: [{
        id: 'test-topic',
        title: 'Sports',
        student_id: 'test-student-id',
        tutor_id: 'test-tutor-id',
        is_custom: false,
        created_at: new Date().toISOString()
      }],
      error: null
    })
    
    // Mock AI generation failure
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('AI service unavailable')
    })
    
    render(<DiscussionTopicsTab student={mockStudent} />)
    
    // Click on topic
    await waitFor(() => {
      const topicElement = screen.getByText('Sports')
      fireEvent.click(topicElement)
    })
    
    // Should handle the error gracefully
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})