import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TopicsList } from '@/components/students/TopicsList'

const mockTopics = [
  {
    id: 'topic-1',
    title: 'Travel and Adventure',
    student_id: 'student-1',
    tutor_id: 'tutor-1',
    created_at: '2024-01-01T00:00:00Z',
    questions_count: 5
  },
  {
    id: 'topic-2',
    title: 'Food and Culture',
    student_id: 'student-1',
    tutor_id: 'tutor-1',
    created_at: '2024-01-02T00:00:00Z',
    questions_count: 3
  }
]

// Mock the database functions
jest.mock('@/lib/discussion-questions-db', () => ({
  getQuestionsByTopicId: jest.fn()
}))

describe('TopicsList', () => {
  const defaultProps = {
    topics: mockTopics,
    onTopicSelect: jest.fn(),
    onTopicDelete: jest.fn(),
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all topics', () => {
    render(<TopicsList {...defaultProps} />)
    
    expect(screen.getByText('Travel and Adventure')).toBeInTheDocument()
    expect(screen.getByText('Food and Culture')).toBeInTheDocument()
  })

  it('shows question count for each topic', () => {
    render(<TopicsList {...defaultProps} />)
    
    expect(screen.getByText('5 questions')).toBeInTheDocument()
    expect(screen.getByText('3 questions')).toBeInTheDocument()
  })

  it('calls onTopicSelect when topic is clicked', () => {
    render(<TopicsList {...defaultProps} />)
    
    const topicCard = screen.getByText('Travel and Adventure').closest('div')
    fireEvent.click(topicCard!)
    
    expect(defaultProps.onTopicSelect).toHaveBeenCalledWith(mockTopics[0])
  })

  it('shows delete button on hover and calls onTopicDelete', () => {
    render(<TopicsList {...defaultProps} />)
    
    const topicCard = screen.getByText('Travel and Adventure').closest('div')
    fireEvent.mouseEnter(topicCard!)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    expect(defaultProps.onTopicDelete).toHaveBeenCalledWith('topic-1')
  })

  it('shows loading state when isLoading is true', () => {
    render(<TopicsList {...defaultProps} isLoading={true} />)
    
    expect(screen.getByTestId('topics-loading')).toBeInTheDocument()
  })

  it('shows empty state when no topics', () => {
    render(<TopicsList {...defaultProps} topics={[]} />)
    
    expect(screen.getByText('No discussion topics yet')).toBeInTheDocument()
    expect(screen.getByText(/create your first topic/i)).toBeInTheDocument()
  })

  it('formats creation date correctly', () => {
    render(<TopicsList {...defaultProps} />)
    
    expect(screen.getByText(/created/i)).toBeInTheDocument()
  })

  it('shows practice button for topics with questions', () => {
    render(<TopicsList {...defaultProps} />)
    
    const practiceButtons = screen.getAllByText(/practice/i)
    expect(practiceButtons).toHaveLength(2)
  })

  it('disables practice button for topics without questions', () => {
    const topicsWithoutQuestions = [
      { ...mockTopics[0], questions_count: 0 }
    ]
    
    render(<TopicsList {...defaultProps} topics={topicsWithoutQuestions} />)
    
    const practiceButton = screen.getByRole('button', { name: /practice/i })
    expect(practiceButton).toBeDisabled()
  })
})