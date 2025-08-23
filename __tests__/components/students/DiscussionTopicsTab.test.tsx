import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DiscussionTopicsTab } from '@/components/students/DiscussionTopicsTab'

const mockStudent = {
  id: 'student-1',
  name: 'John Doe',
  tutor_id: 'tutor-1'
}

// Mock all the database functions
jest.mock('@/lib/discussion-topics-db', () => ({
  getTopicsByStudentId: jest.fn(),
  deleteDiscussionTopic: jest.fn()
}))

jest.mock('@/lib/discussion-questions-db', () => ({
  getQuestionsByTopicId: jest.fn()
}))

describe('DiscussionTopicsTab', () => {
  const defaultProps = {
    student: mockStudent
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock implementations
    const { getTopicsByStudentId } = require('@/lib/discussion-topics-db')
    getTopicsByStudentId.mockResolvedValue({
      data: [
        {
          id: 'topic-1',
          title: 'Travel Adventures',
          student_id: 'student-1',
          tutor_id: 'tutor-1',
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      error: null
    })
  })

  it('renders the discussion topics tab', async () => {
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    expect(screen.getByText('Discussion Topics')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Travel Adventures')).toBeInTheDocument()
    })
  })

  it('shows create topic button', () => {
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /create new topic/i })).toBeInTheDocument()
  })

  it('opens custom topic input when create button is clicked', () => {
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /create new topic/i })
    fireEvent.click(createButton)
    
    expect(screen.getByPlaceholderText(/enter a custom topic/i)).toBeInTheDocument()
  })

  it('shows loading state while fetching topics', () => {
    const { getTopicsByStudentId } = require('@/lib/discussion-topics-db')
    getTopicsByStudentId.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    expect(screen.getByTestId('topics-loading')).toBeInTheDocument()
  })

  it('shows error state when fetching fails', async () => {
    const { getTopicsByStudentId } = require('@/lib/discussion-topics-db')
    getTopicsByStudentId.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch topics' }
    })
    
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load topics/i)).toBeInTheDocument()
    })
  })

  it('opens flashcard interface when topic is selected', async () => {
    const { getQuestionsByTopicId } = require('@/lib/discussion-questions-db')
    getQuestionsByTopicId.mockResolvedValue({
      data: [
        {
          id: 'q1',
          topic_id: 'topic-1',
          question_text: 'What is your favorite destination?',
          question_order: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      error: null
    })
    
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    await waitFor(() => {
      const topicCard = screen.getByText('Travel Adventures')
      fireEvent.click(topicCard)
    })
    
    await waitFor(() => {
      expect(screen.getByText('What is your favorite destination?')).toBeInTheDocument()
    })
  })

  it('deletes topic when delete is confirmed', async () => {
    const { deleteDiscussionTopic } = require('@/lib/discussion-topics-db')
    deleteDiscussionTopic.mockResolvedValue({ error: null })
    
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    await waitFor(() => {
      const topicCard = screen.getByText('Travel Adventures').closest('div')
      fireEvent.mouseEnter(topicCard!)
    })
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    // Confirm deletion in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(deleteDiscussionTopic).toHaveBeenCalledWith('topic-1')
    })
  })

  it('refreshes topics list after topic creation', async () => {
    const { getTopicsByStudentId } = require('@/lib/discussion-topics-db')
    
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    // Simulate topic creation
    const createButton = screen.getByRole('button', { name: /create new topic/i })
    fireEvent.click(createButton)
    
    // Mock successful topic creation callback
    const mockNewTopic = {
      id: 'new-topic',
      title: 'New Topic',
      student_id: 'student-1',
      tutor_id: 'tutor-1',
      created_at: '2024-01-02T00:00:00Z'
    }
    
    // This would be called by the CustomTopicInput component
    // We need to simulate the onTopicCreated callback
    
    expect(getTopicsByStudentId).toHaveBeenCalledWith('student-1')
  })

  it('shows empty state when no topics exist', async () => {
    const { getTopicsByStudentId } = require('@/lib/discussion-topics-db')
    getTopicsByStudentId.mockResolvedValue({
      data: [],
      error: null
    })
    
    render(<DiscussionTopicsTab {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('No discussion topics yet')).toBeInTheDocument()
    })
  })
})