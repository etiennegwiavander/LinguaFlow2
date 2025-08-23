import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomTopicInput } from '@/components/students/CustomTopicInput'

// Mock the database functions
jest.mock('@/lib/discussion-topics-db', () => ({
  createDiscussionTopic: jest.fn()
}))

describe('CustomTopicInput', () => {
  const defaultProps = {
    studentId: 'student-1',
    tutorId: 'tutor-1',
    onTopicCreated: jest.fn(),
    onCancel: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders input field and buttons', () => {
    render(<CustomTopicInput {...defaultProps} />)
    
    expect(screen.getByPlaceholderText(/enter a custom topic/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create topic/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('updates input value when typing', async () => {
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    await user.type(input, 'My Custom Topic')
    
    expect(input).toHaveValue('My Custom Topic')
  })

  it('disables create button when input is empty', () => {
    render(<CustomTopicInput {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /create topic/i })
    expect(createButton).toBeDisabled()
  })

  it('enables create button when input has value', async () => {
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    await user.type(input, 'My Topic')
    
    const createButton = screen.getByRole('button', { name: /create topic/i })
    expect(createButton).not.toBeDisabled()
  })

  it('shows character count', async () => {
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    await user.type(input, 'Test')
    
    expect(screen.getByText('4/100')).toBeInTheDocument()
  })

  it('prevents input beyond character limit', async () => {
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    const longText = 'a'.repeat(101)
    
    await user.type(input, longText)
    
    expect(input).toHaveValue('a'.repeat(100))
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<CustomTopicInput {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows validation error for invalid input', async () => {
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    await user.type(input, '123')
    
    const createButton = screen.getByRole('button', { name: /create topic/i })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/topic must contain at least one letter/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during topic creation', async () => {
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    await user.type(input, 'Valid Topic')
    
    const createButton = screen.getByRole('button', { name: /create topic/i })
    fireEvent.click(createButton)
    
    expect(screen.getByText(/creating/i)).toBeInTheDocument()
  })

  it('clears input after successful creation', async () => {
    const { createDiscussionTopic } = require('@/lib/discussion-topics-db')
    createDiscussionTopic.mockResolvedValue({ 
      data: { id: 'new-topic', title: 'Valid Topic' }, 
      error: null 
    })
    
    const user = userEvent.setup()
    render(<CustomTopicInput {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/enter a custom topic/i)
    await user.type(input, 'Valid Topic')
    
    const createButton = screen.getByRole('button', { name: /create topic/i })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })
})