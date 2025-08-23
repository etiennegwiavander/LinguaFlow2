import { render, screen, fireEvent } from '@testing-library/react'
import { NavigationControls } from '@/components/students/NavigationControls'
import { beforeEach } from 'node:test'

describe('NavigationControls', () => {
  const defaultProps = {
    currentIndex: 1,
    totalQuestions: 5,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onReset: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders current question position correctly', () => {
    render(<NavigationControls {...defaultProps} />)
    
    // The component shows "2/5" in a span element - use a more flexible matcher
    expect(screen.getByText((content, element) => {
      return element?.textContent === '2/5'
    })).toBeInTheDocument()
  })

  it('disables previous button on first question', () => {
    render(<NavigationControls {...defaultProps} currentIndex={0} />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last question', () => {
    render(<NavigationControls {...defaultProps} currentIndex={4} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
  })

  it('enables both buttons on middle questions', () => {
    render(<NavigationControls {...defaultProps} />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    const nextButton = screen.getByRole('button', { name: /next/i })
    
    expect(prevButton).not.toBeDisabled()
    expect(nextButton).not.toBeDisabled()
  })

  it('calls onPrevious when previous button is clicked', () => {
    render(<NavigationControls {...defaultProps} />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    fireEvent.click(prevButton)
    
    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when next button is clicked', () => {
    render(<NavigationControls {...defaultProps} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)
    
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onReset when reset button is clicked', () => {
    render(<NavigationControls {...defaultProps} />)
    
    const resetButton = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(resetButton)
    
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1)
  })

  it('shows progress indicators with correct state', () => {
    render(<NavigationControls {...defaultProps} />)
    
    // Check that the current question tabs are selected (there are mobile and desktop versions)
    const currentQuestionTabs = screen.getAllByRole('tab', { name: /question 2 \(current\)/i })
    expect(currentQuestionTabs).toHaveLength(2) // Mobile and desktop versions
    currentQuestionTabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected', 'true')
    })
    
    // Check that other tabs are not selected
    const firstQuestionTabs = screen.getAllByRole('tab', { name: /^question 1$/i })
    firstQuestionTabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected', 'false')
    })
  })
})