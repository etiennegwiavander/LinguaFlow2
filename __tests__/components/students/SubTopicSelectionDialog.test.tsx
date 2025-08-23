import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SubTopicSelectionDialog } from '@/components/students/SubTopicSelectionDialog'

const mockTopic = {
  id: 'topic-1',
  title: 'Travel and Adventure',
  student_id: 'student-1',
  tutor_id: 'tutor-1',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock the Supabase function
jest.mock('@/supabase/functions/generate-discussion-questions', () => ({
  generateDiscussionQuestions: jest.fn()
}))

describe('SubTopicSelectionDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    topic: mockTopic,
    onQuestionsGenerated: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    expect(screen.getByText('Select Sub-topics')).toBeInTheDocument()
    expect(screen.getByText('Travel and Adventure')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SubTopicSelectionDialog {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Select Sub-topics')).not.toBeInTheDocument()
  })

  it('shows predefined sub-topics for the topic', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    // These would be based on the actual sub-topics defined in the component
    expect(screen.getByText(/transportation/i)).toBeInTheDocument()
    expect(screen.getByText(/accommodation/i)).toBeInTheDocument()
    expect(screen.getByText(/cultural experiences/i)).toBeInTheDocument()
  })

  it('allows selecting and deselecting sub-topics', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const checkbox = screen.getByRole('checkbox', { name: /transportation/i })
    
    // Initially unchecked
    expect(checkbox).not.toBeChecked()
    
    // Click to select
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    
    // Click to deselect
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('shows custom sub-topic input', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    expect(screen.getByPlaceholderText(/add custom sub-topic/i)).toBeInTheDocument()
  })

  it('adds custom sub-topic when entered', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/add custom sub-topic/i)
    const addButton = screen.getByRole('button', { name: /add/i })
    
    fireEvent.change(input, { target: { value: 'Custom Adventure' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('Custom Adventure')).toBeInTheDocument()
  })

  it('disables generate button when no sub-topics selected', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const generateButton = screen.getByRole('button', { name: /generate questions/i })
    expect(generateButton).toBeDisabled()
  })

  it('enables generate button when sub-topics are selected', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const checkbox = screen.getByRole('checkbox', { name: /transportation/i })
    fireEvent.click(checkbox)
    
    const generateButton = screen.getByRole('button', { name: /generate questions/i })
    expect(generateButton).not.toBeDisabled()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('shows loading state during question generation', async () => {
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const checkbox = screen.getByRole('checkbox', { name: /transportation/i })
    fireEvent.click(checkbox)
    
    const generateButton = screen.getByRole('button', { name: /generate questions/i })
    fireEvent.click(generateButton)
    
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
  })

  it('shows error message on generation failure', async () => {
    const { generateDiscussionQuestions } = require('@/supabase/functions/generate-discussion-questions')
    generateDiscussionQuestions.mockRejectedValue(new Error('Generation failed'))
    
    render(<SubTopicSelectionDialog {...defaultProps} />)
    
    const checkbox = screen.getByRole('checkbox', { name: /transportation/i })
    fireEvent.click(checkbox)
    
    const generateButton = screen.getByRole('button', { name: /generate questions/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to generate questions/i)).toBeInTheDocument()
    })
  })
})