import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VocabularyCard } from '@/components/students/VocabularyCard';
import { VocabularyCardData } from '@/types';

const mockVocabularyData: VocabularyCardData = {
  word: 'beautiful',
  pronunciation: 'ˈbjuːtɪfʊl',
  partOfSpeech: 'adjective',
  definition: 'Pleasing the senses or mind aesthetically',
  exampleSentences: {
    present: 'The garden is beautiful in spring.',
    past: 'The sunset was beautiful yesterday.',
    future: 'The flowers will be beautiful next month.',
    presentPerfect: 'The view has been beautiful all day.',
    pastPerfect: 'The landscape had been beautiful before the storm.',
    futurePerfect: 'The garden will have been beautiful for years by then.'
  }
};

describe('VocabularyCard', () => {
  const defaultProps = {
    vocabularyData: mockVocabularyData,
    currentIndex: 0,
    totalWords: 10,
    isAnimating: false,
    direction: 'forward' as const,
    isLoading: false
  };

  it('renders vocabulary word prominently', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    const wordElement = screen.getByRole('heading', { level: 1 });
    expect(wordElement).toHaveTextContent('beautiful');
    expect(wordElement).toHaveClass('text-2xl', 'sm:text-3xl', 'md:text-4xl', 'lg:text-5xl', 'font-bold');
  });

  it('displays pronunciation correctly', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    expect(screen.getByText('/ˈbjuːtɪfʊl/')).toBeInTheDocument();
  });

  it('shows part of speech', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    // Use getAllByText since "adjective" appears twice (in progress and in badge)
    const partOfSpeechElements = screen.getAllByText('adjective');
    expect(partOfSpeechElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays definition', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    expect(screen.getByText('Pleasing the senses or mind aesthetically')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    expect(screen.getByText('Word 1 of 10')).toBeInTheDocument();
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '10');
  });

  it('has collapsible example sentences', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    const expandButton = screen.getByRole('button', { name: /example sentences/i });
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands and shows example sentences when clicked', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    const expandButton = screen.getByRole('button', { name: /example sentences/i });
    fireEvent.click(expandButton);
    
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    
    // Check for tense categories (they appear as "Present", not "PRESENT")
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.getByText('Future')).toBeInTheDocument();
    expect(screen.getByText('Present Perfect')).toBeInTheDocument();
    expect(screen.getByText('Past Perfect')).toBeInTheDocument();
    expect(screen.getByText('Future Perfect')).toBeInTheDocument();
  });

  it('highlights vocabulary word in example sentences', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    const expandButton = screen.getByRole('button', { name: /example sentences/i });
    fireEvent.click(expandButton);
    
    // Check that the word is highlighted in sentences - use getAllByText since there are multiple instances
    const highlightedWords = screen.getAllByText('beautiful');
    expect(highlightedWords.length).toBeGreaterThan(1); // Should appear in multiple sentences
    
    // Check that at least one sentence contains the highlighted word
    const sentenceWithHighlight = screen.getByText(/The garden is.*in spring/);
    expect(sentenceWithHighlight).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<VocabularyCard {...defaultProps} isLoading={true} />);
    
    // Should show skeleton loading instead of content
    expect(screen.queryByText('beautiful')).not.toBeInTheDocument();
    
    // Should have loading animation - check for the animate-pulse class in the container
    const loadingContainer = document.querySelector('.animate-pulse');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('handles pronunciation button click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<VocabularyCard {...defaultProps} />);
    
    const pronunciationButton = screen.getByRole('button', { name: /play pronunciation/i });
    fireEvent.click(pronunciationButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Playing pronunciation for:', 'beautiful');
    consoleSpy.mockRestore();
  });

  it('applies animation classes correctly', () => {
    const { rerender } = render(<VocabularyCard {...defaultProps} isAnimating={false} />);
    
    let card = screen.getByRole('article');
    expect(card).toHaveClass('translate-x-0', 'opacity-100', 'scale-100');
    
    rerender(<VocabularyCard {...defaultProps} isAnimating={true} direction="forward" />);
    card = screen.getByRole('article');
    expect(card).toHaveClass('translate-x-full', 'opacity-0', 'scale-95');
    
    rerender(<VocabularyCard {...defaultProps} isAnimating={true} direction="backward" />);
    card = screen.getByRole('article');
    expect(card).toHaveClass('-translate-x-full', 'opacity-0', 'scale-95');
  });

  it('has proper accessibility attributes', () => {
    render(<VocabularyCard {...defaultProps} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Vocabulary word 1 of 10: beautiful');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Progress: 1 of 10 vocabulary words');
  });

  it('resets expansion state when word changes', () => {
    const { rerender } = render(<VocabularyCard {...defaultProps} />);
    
    // Expand the examples
    const expandButton = screen.getByRole('button', { name: /example sentences/i });
    fireEvent.click(expandButton);
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    
    // Change the word
    const newVocabularyData = { ...mockVocabularyData, word: 'amazing' };
    rerender(<VocabularyCard {...defaultProps} vocabularyData={newVocabularyData} />);
    
    // Should be collapsed again
    const newExpandButton = screen.getByRole('button', { name: /example sentences/i });
    expect(newExpandButton).toHaveAttribute('aria-expanded', 'false');
  });
});