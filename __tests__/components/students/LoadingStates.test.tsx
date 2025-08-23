import { render, screen } from '@testing-library/react'
import { 
  TopicsLoadingState, 
  QuestionsLoadingState, 
  GeneratingQuestionsState 
} from '@/components/students/LoadingStates'

describe('LoadingStates', () => {
  describe('TopicsLoadingState', () => {
    it('renders topics loading skeleton', () => {
      render(<TopicsLoadingState />)
      
      expect(screen.getByTestId('topics-loading')).toBeInTheDocument()
      expect(screen.getByText(/loading topics/i)).toBeInTheDocument()
    })

    it('shows multiple skeleton cards', () => {
      render(<TopicsLoadingState />)
      
      const skeletonCards = screen.getAllByTestId('topic-skeleton')
      expect(skeletonCards.length).toBeGreaterThan(1)
    })
  })

  describe('QuestionsLoadingState', () => {
    it('renders questions loading skeleton', () => {
      render(<QuestionsLoadingState />)
      
      expect(screen.getByTestId('questions-loading')).toBeInTheDocument()
      expect(screen.getByText(/loading questions/i)).toBeInTheDocument()
    })

    it('shows spinner animation', () => {
      render(<QuestionsLoadingState />)
      
      const spinner = screen.getByTestId('loading-spinner')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('GeneratingQuestionsState', () => {
    it('renders generating questions state', () => {
      render(<GeneratingQuestionsState />)
      
      expect(screen.getByText(/generating questions/i)).toBeInTheDocument()
      expect(screen.getByText(/this may take a moment/i)).toBeInTheDocument()
    })

    it('shows progress indicator', () => {
      render(<GeneratingQuestionsState />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('displays AI generation message', () => {
      render(<GeneratingQuestionsState />)
      
      expect(screen.getByText(/ai is creating personalized questions/i)).toBeInTheDocument()
    })
  })
})