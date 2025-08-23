import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudentProfileClient } from '@/components/students/StudentProfileClient'

// Mock all dependencies
jest.mock('@/lib/discussion-topics-db')
jest.mock('@/lib/discussion-questions-db')
jest.mock('@/components/students/DiscussionTopicsTab')

const mockStudent = {
  id: 'student-1',
  name: 'John Doe',
  email: 'john@example.com',
  tutor_id: 'tutor-1',
  level: 'B1',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock DiscussionTopicsTab component
const MockDiscussionTopicsTab = ({ student }: { student: any }) => (
  <div data-testid="discussion-topics-tab">
    <h3>Discussion Topics for {student.name}</h3>
    <button>Create New Topic</button>
    <div>Mock topics list</div>
  </div>
)

describe('Student Profile Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock the DiscussionTopicsTab component
    const { DiscussionTopicsTab } = require('@/components/students/DiscussionTopicsTab')
    DiscussionTopicsTab.mockImplementation(MockDiscussionTopicsTab)
  })

  it('integrates discussion topics tab within student profile', async () => {
    render(<StudentProfileClient student={mockStudent} />)
    
    // Verify student profile renders
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Navigate to discussion topics tab
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    // Verify discussion topics tab is active and renders correctly
    await waitFor(() => {
      expect(screen.getByTestId('discussion-topics-tab')).toBeInTheDocument()
      expect(screen.getByText('Discussion Topics for John Doe')).toBeInTheDocument()
    })
  })

  it('maintains tab state during navigation', async () => {
    render(<StudentProfileClient student={mockStudent} />)
    
    // Start on overview tab
    expect(screen.getByRole('tabpanel', { name: /overview/i })).toBeInTheDocument()
    
    // Navigate to discussion topics
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('discussion-topics-tab')).toBeInTheDocument()
    })
    
    // Navigate to lessons tab
    const lessonsTab = screen.getByRole('tab', { name: /lessons/i })
    fireEvent.click(lessonsTab)
    
    await waitFor(() => {
      expect(screen.queryByTestId('discussion-topics-tab')).not.toBeInTheDocument()
    })
    
    // Navigate back to discussion topics
    fireEvent.click(discussionTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('discussion-topics-tab')).toBeInTheDocument()
    })
  })

  it('passes correct student data to discussion topics component', async () => {
    const { DiscussionTopicsTab } = require('@/components/students/DiscussionTopicsTab')
    
    render(<StudentProfileClient student={mockStudent} />)
    
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    await waitFor(() => {
      expect(DiscussionTopicsTab).toHaveBeenCalledWith(
        expect.objectContaining({
          student: mockStudent
        }),
        expect.anything()
      )
    })
  })

  it('handles student data updates correctly', async () => {
    const { rerender } = render(<StudentProfileClient student={mockStudent} />)
    
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    await waitFor(() => {
      expect(screen.getByText('Discussion Topics for John Doe')).toBeInTheDocument()
    })
    
    // Update student data
    const updatedStudent = { ...mockStudent, name: 'Jane Doe' }
    rerender(<StudentProfileClient student={updatedStudent} />)
    
    await waitFor(() => {
      expect(screen.getByText('Discussion Topics for Jane Doe')).toBeInTheDocument()
    })
  })

  it('maintains responsive layout across different screen sizes', async () => {
    // Mock window resize
    const originalInnerWidth = window.innerWidth
    
    // Test mobile layout
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))
    
    render(<StudentProfileClient student={mockStudent} />)
    
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('discussion-topics-tab')).toBeInTheDocument()
    })
    
    // Test desktop layout
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    window.dispatchEvent(new Event('resize'))
    
    await waitFor(() => {
      expect(screen.getByTestId('discussion-topics-tab')).toBeInTheDocument()
    })
    
    // Restore original width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  it('handles tab accessibility correctly', async () => {
    render(<StudentProfileClient student={mockStudent} />)
    
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    
    // Test keyboard navigation
    discussionTab.focus()
    fireEvent.keyDown(discussionTab, { key: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByTestId('discussion-topics-tab')).toBeInTheDocument()
    })
    
    // Verify ARIA attributes
    expect(discussionTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('discussion-topics-tab')).toHaveAttribute('role', 'tabpanel')
  })

  it('preserves discussion topics state during profile updates', async () => {
    const { DiscussionTopicsTab } = require('@/components/students/DiscussionTopicsTab')
    
    render(<StudentProfileClient student={mockStudent} />)
    
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    await waitFor(() => {
      expect(DiscussionTopicsTab).toHaveBeenCalledTimes(1)
    })
    
    // Simulate a profile update that doesn't affect student ID
    const updatedStudent = { ...mockStudent, level: 'B2' }
    const { rerender } = render(<StudentProfileClient student={updatedStudent} />)
    
    // Discussion topics should re-render with updated student data
    await waitFor(() => {
      expect(DiscussionTopicsTab).toHaveBeenCalledWith(
        expect.objectContaining({
          student: updatedStudent
        }),
        expect.anything()
      )
    })
  })

  it('handles error states in tab navigation', async () => {
    const { DiscussionTopicsTab } = require('@/components/students/DiscussionTopicsTab')
    
    // Mock DiscussionTopicsTab to throw an error
    DiscussionTopicsTab.mockImplementation(() => {
      throw new Error('Failed to load discussion topics')
    })
    
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<StudentProfileClient student={mockStudent} />)
    
    const discussionTab = screen.getByRole('tab', { name: /discussion topics/i })
    fireEvent.click(discussionTab)
    
    // Should show error boundary or fallback
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })
})