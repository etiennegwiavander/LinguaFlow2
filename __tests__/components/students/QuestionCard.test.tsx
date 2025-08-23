import { render, screen, waitFor } from '@testing-library/react'
import { QuestionCard } from '@/components/students/QuestionCard'

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

const mockQuestion = {
  id: '1',
  topic_id: 'topic-1',
  question_text: 'What is your favorite hobby?',
  question_order: 1,
  difficulty_level: 'intermediate',
  created_at: '2024-01-01T00:00:00Z'
}

describe('QuestionCard', () => {
  it('renders question text correctly', async () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={5}
        isAnimating={false}
        isLoading={false}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('What is your favorite hobby?')).toBeInTheDocument()
    })
  })

  it('shows progress indicator with correct values', () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={2}
        totalQuestions={5}
        isAnimating={false}
        isLoading={false}
      />
    )
    
    expect(screen.getByText('Question 3 of 5')).toBeInTheDocument()
  })

  it('displays difficulty level', () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={5}
        isAnimating={false}
        isLoading={false}
      />
    )
    
    expect(screen.getByText('intermediate')).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={5}
        isAnimating={false}
        isLoading={true}
      />
    )
    
    expect(screen.getByText('Loading question...')).toBeInTheDocument()
  })

  it('applies animation classes when isAnimating is true', () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={5}
        isAnimating={true}
        direction="forward"
        isLoading={false}
      />
    )
    
    const card = screen.getByRole('article')
    expect(card).toHaveClass('translate-x-full', 'opacity-0', 'scale-95')
  })

  it('shows correct progress bar width', () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={1}
        totalQuestions={4}
        isAnimating={false}
        isLoading={false}
      />
    )
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle('width: 50%') // 2/4 = 50%
  })

  it('has proper accessibility attributes', () => {
    render(
      <QuestionCard 
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={5}
        isAnimating={false}
        isLoading={false}
      />
    )
    
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-label', 'Discussion question 1 of 5')
    expect(card).toHaveAttribute('tabIndex', '0')
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '1')
    expect(progressBar).toHaveAttribute('aria-valuemin', '1')
    expect(progressBar).toHaveAttribute('aria-valuemax', '5')
  })
})