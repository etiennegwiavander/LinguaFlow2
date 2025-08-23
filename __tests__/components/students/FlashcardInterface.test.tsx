import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FlashcardInterface } from '@/components/students/FlashcardInterface'

const mockQuestions = [
  {
    id: '1',
    topic_id: 'topic-1',
    question_text: 'What is your favorite hobby?',
    question_order: 1,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    topic_id: 'topic-1',
    question_text: 'How do you spend your weekends?',
    question_order: 2,
    created_at: '2024-01-01T00:00:00Z'
  }
]

describe('FlashcardInterface', () => {
  const defaultProps = {
    questions: mockQuestions,
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders first question initially', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    expect(screen.getByText('What is your favorite hobby?')).toBeInTheDocument()
  })

  it('shows correct question count', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('navigates to next question when next button is clicked', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    expect(screen.getByText('How do you spend your weekends?')).toBeInTheDocument()
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
  })

  it('navigates to previous question when previous button is clicked', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    // Go to second question first
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    // Then go back
    const prevButton = screen.getByRole('button', { name: /previous/i })
    fireEvent.click(prevButton)
    
    expect(screen.getByText('What is your favorite hobby?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('resets to first question when reset button is clicked', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    // Navigate to second question
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    // Reset
    const resetButton = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(resetButton)
    
    expect(screen.getByText('What is your favorite hobby?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('handles empty questions array gracefully', () => {
    render(<FlashcardInterface {...defaultProps} questions={[]} />)
    
    expect(screen.getByText('No questions available')).toBeInTheDocument()
  })

  it('shows keyboard shortcuts hint', () => {
    render(<FlashcardInterface {...defaultProps} />)
    
    expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument()
  })
})