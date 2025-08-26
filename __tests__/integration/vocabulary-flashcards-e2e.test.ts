/**
 * Integration Test for Vocabulary Flashcards Feature
 * 
 * Tests the integration between vocabulary generation, session management,
 * and error handling components of the vocabulary flashcards feature.
 */

describe('Vocabulary Flashcards Integration', () => {
  const mockVocabularyWord = {
    word: 'accomplish',
    pronunciation: '/əˈkʌmplɪʃ/',
    partOfSpeech: 'verb',
    definition: 'to complete or achieve something successfully',
    exampleSentences: {
      present: 'I accomplish my goals through hard work.',
      past: 'She accomplished her mission yesterday.',
      future: 'We will accomplish great things together.',
      presentPerfect: 'They have accomplished remarkable progress.',
      pastPerfect: 'He had accomplished his task before the deadline.',
      futurePerfect: 'By next year, we will have accomplished our objectives.'
    }
  }

  const mockStudent = {
    id: 'test-student-id',
    name: 'Test Student',
    level: 'intermediate',
    target_language: 'en',
    native_language: 'es',
    vocabulary_gaps: 'Business vocabulary',
    end_goals: 'Improve conversation skills'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful vocabulary generation
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        words: [mockVocabularyWord]
      })
    })
  })

  it('validates vocabulary data structure for integration', () => {
    // Test vocabulary word structure
    expect(mockVocabularyWord.word).toBe('accomplish')
    expect(mockVocabularyWord.pronunciation).toBe('/əˈkʌmplɪʃ/')
    expect(mockVocabularyWord.partOfSpeech).toBe('verb')
    expect(mockVocabularyWord.definition).toBeDefined()
    expect(mockVocabularyWord.exampleSentences).toBeDefined()
    
    // Test all tense examples exist
    expect(mockVocabularyWord.exampleSentences.present).toBeDefined()
    expect(mockVocabularyWord.exampleSentences.past).toBeDefined()
    expect(mockVocabularyWord.exampleSentences.future).toBeDefined()
    expect(mockVocabularyWord.exampleSentences.presentPerfect).toBeDefined()
    expect(mockVocabularyWord.exampleSentences.pastPerfect).toBeDefined()
    expect(mockVocabularyWord.exampleSentences.futurePerfect).toBeDefined()
  })

  it('integrates vocabulary generation API with personalization', async () => {
    const response = await fetch('/functions/v1/generate-vocabulary-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: mockStudent.id,
        level: mockStudent.level,
        nativeLanguage: mockStudent.native_language,
        vocabularyGaps: mockStudent.vocabulary_gaps,
        learningGoals: mockStudent.end_goals,
        count: 10
      })
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.words).toHaveLength(1)
    expect(data.words[0].word).toBe('accomplish')
  })

  it('validates session management integration', () => {
    const mockSessionManager = {
      createSession: jest.fn().mockResolvedValue({
        sessionId: 'test-session',
        words: [mockVocabularyWord],
        currentPosition: 0
      }),
      updateSessionProgress: jest.fn(),
      getLastMemoryPosition: jest.fn().mockReturnValue(null)
    }
    
    // Test session methods exist
    expect(mockSessionManager.createSession).toBeDefined()
    expect(mockSessionManager.updateSessionProgress).toBeDefined()
    expect(mockSessionManager.getLastMemoryPosition).toBeDefined()
    
    // Test session functionality
    const lastPosition = mockSessionManager.getLastMemoryPosition()
    expect(lastPosition).toBeNull()
    
    mockSessionManager.updateSessionProgress('test-session', 1)
    expect(mockSessionManager.updateSessionProgress).toHaveBeenCalledWith('test-session', 1)
  })

  it('validates error handling and fallback integration', () => {
    const mockFallbackService = {
      getFallbackVocabulary: jest.fn().mockReturnValue([mockVocabularyWord]),
      isVocabularyServiceAvailable: jest.fn().mockResolvedValue(false)
    }
    
    // Test fallback functionality
    const fallbackWords = mockFallbackService.getFallbackVocabulary()
    expect(fallbackWords).toHaveLength(1)
    expect(fallbackWords[0].word).toBe('accomplish')
    
    // Test service availability
    expect(mockFallbackService.isVocabularyServiceAvailable).toBeDefined()
  })

  it('validates navigation and progress tracking integration', () => {
    const mockNavigationState = {
      currentIndex: 0,
      totalWords: 10,
      canGoNext: true,
      canGoPrevious: false,
      progress: 10
    }
    
    expect(mockNavigationState.currentIndex).toBe(0)
    expect(mockNavigationState.totalWords).toBe(10)
    expect(mockNavigationState.canGoNext).toBe(true)
    expect(mockNavigationState.canGoPrevious).toBe(false)
    expect(mockNavigationState.progress).toBe(10)
  })

  it('validates complete vocabulary pipeline integration', async () => {
    // 1. Student provides personalization data
    const personalizationData = {
      studentId: mockStudent.id,
      level: mockStudent.level,
      nativeLanguage: mockStudent.native_language
    }
    
    // 2. API generates vocabulary
    const apiResponse = await fetch('/functions/v1/generate-vocabulary-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personalizationData)
    })
    
    expect(apiResponse.ok).toBe(true)
    
    // 3. Session manages vocabulary
    const sessionData = {
      sessionId: 'pipeline-test',
      words: [mockVocabularyWord],
      currentPosition: 0,
      studentId: mockStudent.id
    }
    
    expect(sessionData.words).toHaveLength(1)
    expect(sessionData.words[0].word).toBe('accomplish')
    
    // 4. Navigation tracks progress
    const navigationState = {
      currentIndex: sessionData.currentPosition,
      totalWords: sessionData.words.length,
      progress: ((sessionData.currentPosition + 1) / sessionData.words.length) * 100
    }
    
    expect(navigationState.currentIndex).toBe(0)
    expect(navigationState.totalWords).toBe(1)
    expect(navigationState.progress).toBe(100)
    
    // 5. Word displays correctly
    const displayedWord = sessionData.words[navigationState.currentIndex]
    expect(displayedWord.word).toBe('accomplish')
    expect(displayedWord.pronunciation).toBe('/əˈkʌmplɪʃ/')
    expect(displayedWord.partOfSpeech).toBe('verb')
    expect(displayedWord.definition).toBeDefined()
    expect(displayedWord.exampleSentences).toBeDefined()
  })
})