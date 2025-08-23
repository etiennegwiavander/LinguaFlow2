import { generateDiscussionQuestions } from '@/supabase/functions/generate-discussion-questions'

// Mock fetch for Supabase Edge Function calls
global.fetch = jest.fn()

describe('AI Question Generation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully generates questions via AI function', async () => {
    const mockResponse = {
      questions: [
        {
          question_text: 'What type of transportation do you prefer for long trips?',
          question_order: 1
        },
        {
          question_text: 'How do you choose your travel destinations?',
          question_order: 2
        },
        {
          question_text: 'What has been your most memorable travel experience?',
          question_order: 3
        }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['transportation', 'destinations', 'experiences'],
      studentId: 'student-1'
    })

    expect(result.questions).toHaveLength(3)
    expect(result.questions[0].question_text).toContain('transportation')
    expect(result.questions[1].question_text).toContain('destinations')
    expect(result.questions[2].question_text).toContain('experience')
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/generate-discussion-questions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('topic-1')
      })
    )
  })

  it('handles AI function errors gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'AI service unavailable' })
    })

    await expect(generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['transportation'],
      studentId: 'student-1'
    })).rejects.toThrow('AI service unavailable')
  })

  it('validates input parameters before calling AI function', async () => {
    await expect(generateDiscussionQuestions({
      topicId: '',
      subTopics: [],
      studentId: 'student-1'
    })).rejects.toThrow('Invalid parameters')

    await expect(generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['transportation'],
      studentId: ''
    })).rejects.toThrow('Invalid parameters')
  })

  it('handles network errors during AI function call', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    await expect(generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['transportation'],
      studentId: 'student-1'
    })).rejects.toThrow('Network error')
  })

  it('processes different sub-topic combinations correctly', async () => {
    const mockResponse = {
      questions: [
        {
          question_text: 'How do you budget for your travels?',
          question_order: 1
        },
        {
          question_text: 'What cultural activities interest you most?',
          question_order: 2
        }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['budget', 'culture'],
      studentId: 'student-1'
    })

    expect(result.questions).toHaveLength(2)
    expect(result.questions[0].question_text).toContain('budget')
    expect(result.questions[1].question_text).toContain('cultural')
  })

  it('handles custom sub-topics in AI generation', async () => {
    const mockResponse = {
      questions: [
        {
          question_text: 'What adventure sports have you tried or would like to try?',
          question_order: 1
        }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['adventure sports'],
      studentId: 'student-1'
    })

    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].question_text).toContain('adventure sports')
  })

  it('maintains question order consistency', async () => {
    const mockResponse = {
      questions: [
        { question_text: 'Question 3', question_order: 3 },
        { question_text: 'Question 1', question_order: 1 },
        { question_text: 'Question 2', question_order: 2 }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['transportation'],
      studentId: 'student-1'
    })

    // Verify questions are returned in the order specified by question_order
    expect(result.questions[0].question_order).toBe(3)
    expect(result.questions[1].question_order).toBe(1)
    expect(result.questions[2].question_order).toBe(2)
  })

  it('handles timeout scenarios', async () => {
    // Mock a delayed response that times out
    ;(fetch as jest.Mock).mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    )

    await expect(generateDiscussionQuestions({
      topicId: 'topic-1',
      subTopics: ['transportation'],
      studentId: 'student-1'
    })).rejects.toThrow('Request timeout')
  })
})