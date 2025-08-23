import { render, screen, fireEvent } from '@testing-library/react'
import { 
  TopicsErrorFallback, 
  QuestionsErrorFallback, 
  GenerationErrorFallback 
} from '@/components/students/ErrorFallbacks'

describe('ErrorFallbacks', () => {
  describe('TopicsErrorFallback', () => {
    const defaultProps = {
      error: new Error('Failed to load topics'),
      onRetry: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders topics error message', () => {
      render(<TopicsErrorFallback {...defaultProps} />)
      
      expect(screen.getByText(/failed to load topics/i)).toBeInTheDocument()
      expect(screen.getByText(/failed to load topics/i)).toBeInTheDocument()
    })

    it('shows error details', () => {
      render(<TopicsErrorFallback {...defaultProps} />)
      
      expect(screen.getByText('Failed to load topics')).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', () => {
      render(<TopicsErrorFallback {...defaultProps} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)
      
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows refresh suggestion', () => {
      render(<TopicsErrorFallback {...defaultProps} />)
      
      expect(screen.getByText(/please try again/i)).toBeInTheDocument()
    })
  })

  describe('QuestionsErrorFallback', () => {
    const defaultProps = {
      error: new Error('Failed to load questions'),
      onRetry: jest.fn(),
      onBack: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders questions error message', () => {
      render(<QuestionsErrorFallback {...defaultProps} />)
      
      expect(screen.getByText(/failed to load questions/i)).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', () => {
      render(<QuestionsErrorFallback {...defaultProps} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)
      
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
    })

    it('calls onBack when back button is clicked', () => {
      render(<QuestionsErrorFallback {...defaultProps} />)
      
      const backButton = screen.getByRole('button', { name: /back to topics/i })
      fireEvent.click(backButton)
      
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('GenerationErrorFallback', () => {
    const defaultProps = {
      error: new Error('Generation failed'),
      onRetry: jest.fn(),
      onCancel: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders generation error message', () => {
      render(<GenerationErrorFallback {...defaultProps} />)
      
      expect(screen.getByText(/failed to generate questions/i)).toBeInTheDocument()
    })

    it('shows helpful suggestions', () => {
      render(<GenerationErrorFallback {...defaultProps} />)
      
      expect(screen.getByText(/try selecting different sub-topics/i)).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', () => {
      render(<GenerationErrorFallback {...defaultProps} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)
      
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel button is clicked', () => {
      render(<GenerationErrorFallback {...defaultProps} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })
  })
})