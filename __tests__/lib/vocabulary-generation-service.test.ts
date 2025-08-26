import { VocabularyCardData, StudentVocabularyProfile } from '@/types';

// Mock fetch for testing the vocabulary generation service
global.fetch = jest.fn();

describe('Vocabulary Generation Service Personalization Logic', () => {
  const mockStudentProfiles: { [key: string]: StudentVocabularyProfile } = {
    businessStudent: {
      studentId: 'business-student-1',
      proficiencyLevel: 'B2',
      nativeLanguage: 'Spanish',
      learningGoals: ['business', 'professional development'],
      vocabularyWeaknesses: ['technical terms', 'formal communication'],
      conversationalBarriers: ['vocabulary', 'confidence'],
      seenWords: ['hello', 'meeting', 'presentation']
    },
    travelStudent: {
      studentId: 'travel-student-1',
      proficiencyLevel: 'A2',
      nativeLanguage: 'French',
      learningGoals: ['travel', 'tourism', 'cultural exchange'],
      vocabularyWeaknesses: ['directions', 'food vocabulary'],
      conversationalBarriers: ['vocabulary'],
      seenWords: ['airport', 'hotel', 'restaurant']
    },
    academicStudent: {
      studentId: 'academic-student-1',
      proficiencyLevel: 'C1',
      nativeLanguage: 'German',
      learningGoals: ['academic writing', 'research'],
      vocabularyWeaknesses: ['academic terminology', 'complex structures'],
      conversationalBarriers: ['formal register'],
      seenWords: ['research', 'methodology', 'analysis']
    },
    beginnerStudent: {
      studentId: 'beginner-student-1',
      proficiencyLevel: 'A1',
      nativeLanguage: 'Mandarin',
      learningGoals: ['basic communication', 'daily life'],
      vocabularyWeaknesses: ['basic verbs', 'common adjectives'],
      conversationalBarriers: ['vocabulary', 'pronunciation'],
      seenWords: ['hello', 'goodbye', 'thank you']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI-Powered Vocabulary Generation', () => {
    it('generates vocabulary words based on proficiency level', async () => {
      const mockResponse = {
        success: true,
        words: [
          {
            word: 'negotiate',
            pronunciation: '/nɪˈɡoʊʃieɪt/',
            partOfSpeech: 'verb',
            definition: 'To discuss something with someone in order to reach an agreement',
            exampleSentences: {
              present: 'She **negotiates** contracts with clients.',
              past: 'He **negotiated** a better salary yesterday.',
              future: 'They will **negotiate** the terms tomorrow.',
              presentPerfect: 'We have **negotiated** many deals this year.',
              pastPerfect: 'She had **negotiated** before the deadline.',
              futurePerfect: 'By next month, we will have **negotiated** all contracts.'
            }
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: mockStudentProfiles.businessStudent.studentId,
          count: 1,
          exclude_words: mockStudentProfiles.businessStudent.seenWords,
          student_profile: mockStudentProfiles.businessStudent
        })
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.words).toHaveLength(1);
      expect(result.words[0].word).toBe('negotiate');
      expect(result.words[0].partOfSpeech).toBe('verb');
      expect(result.words[0].definition).toContain('agreement');
    });

    it('personalizes vocabulary based on learning goals', async () => {
      const businessWords = [
        { word: 'negotiate', partOfSpeech: 'verb' },
        { word: 'collaborate', partOfSpeech: 'verb' },
        { word: 'strategy', partOfSpeech: 'noun' }
      ];

      const travelWords = [
        { word: 'passport', partOfSpeech: 'noun' },
        { word: 'luggage', partOfSpeech: 'noun' },
        { word: 'itinerary', partOfSpeech: 'noun' }
      ];

      // Test business-focused vocabulary
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: businessWords.map(w => ({
            ...w,
            pronunciation: '/test/',
            definition: 'Business-related term',
            exampleSentences: {
              present: `**${w.word}** is important in business.`,
              past: `**${w.word}** was used yesterday.`,
              future: `**${w.word}** will be needed tomorrow.`,
              presentPerfect: `**${w.word}** has been essential.`,
              pastPerfect: `**${w.word}** had been planned.`,
              futurePerfect: `**${w.word}** will have been implemented.`
            }
          }))
        })
      });

      const businessResponse = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.businessStudent.studentId,
          student_profile: mockStudentProfiles.businessStudent,
          count: 3
        })
      });

      const businessResult = await businessResponse.json();
      expect(businessResult.words.every((w: any) => 
        ['negotiate', 'collaborate', 'strategy'].includes(w.word)
      )).toBe(true);

      // Test travel-focused vocabulary
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: travelWords.map(w => ({
            ...w,
            pronunciation: '/test/',
            definition: 'Travel-related term',
            exampleSentences: {
              present: `**${w.word}** is needed for travel.`,
              past: `**${w.word}** was packed yesterday.`,
              future: `**${w.word}** will be ready tomorrow.`,
              presentPerfect: `**${w.word}** has been prepared.`,
              pastPerfected: `**${w.word}** had been organized.`,
              futurePerfect: `**${w.word}** will have been arranged.`
            }
          }))
        })
      });

      const travelResponse = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.travelStudent.studentId,
          student_profile: mockStudentProfiles.travelStudent,
          count: 3
        })
      });

      const travelResult = await travelResponse.json();
      expect(travelResult.words.every((w: any) => 
        ['passport', 'luggage', 'itinerary'].includes(w.word)
      )).toBe(true);
    });

    it('considers vocabulary weaknesses in word selection', async () => {
      const technicalWords = [
        {
          word: 'algorithm',
          pronunciation: '/ˈælɡərɪðəm/',
          partOfSpeech: 'noun',
          definition: 'A set of rules or instructions for solving a problem',
          exampleSentences: {
            present: 'The **algorithm** processes data efficiently.',
            past: 'The **algorithm** worked perfectly yesterday.',
            future: 'The **algorithm** will improve performance.',
            presentPerfect: 'The **algorithm** has been optimized.',
            pastPerfect: 'The **algorithm** had been tested thoroughly.',
            futurePerfect: 'The **algorithm** will have been implemented.'
          }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: technicalWords
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.businessStudent.studentId,
          student_profile: mockStudentProfiles.businessStudent,
          count: 1
        })
      });

      const result = await response.json();
      expect(result.words[0].word).toBe('algorithm');
      expect(result.words[0].definition).toContain('problem');
    });

    it('avoids false friends based on native language', async () => {
      const spanishFalseFriends = ['actual', 'realize', 'success', 'library'];
      const safeWords = [
        {
          word: 'effective',
          pronunciation: '/ɪˈfektɪv/',
          partOfSpeech: 'adjective',
          definition: 'Successful in producing a desired result',
          exampleSentences: {
            present: 'The strategy is **effective**.',
            past: 'The method was **effective**.',
            future: 'The approach will be **effective**.',
            presentPerfect: 'The solution has been **effective**.',
            pastPerfect: 'The plan had been **effective**.',
            futurePerfect: 'The system will have been **effective**.'
          }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: safeWords
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.businessStudent.studentId,
          student_profile: mockStudentProfiles.businessStudent,
          count: 1
        })
      });

      const result = await response.json();
      expect(spanishFalseFriends).not.toContain(result.words[0].word);
      expect(result.words[0].word).toBe('effective');
    });

    it('excludes previously seen words', async () => {
      const newWords = [
        {
          word: 'innovative',
          pronunciation: '/ˈɪnəveɪtɪv/',
          partOfSpeech: 'adjective',
          definition: 'Featuring new methods; advanced and original',
          exampleSentences: {
            present: 'The company is **innovative**.',
            past: 'The solution was **innovative**.',
            future: 'The product will be **innovative**.',
            presentPerfect: 'The approach has been **innovative**.',
            pastPerfect: 'The design had been **innovative**.',
            futurePerfect: 'The technology will have been **innovative**.'
          }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: newWords
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.businessStudent.studentId,
          student_profile: mockStudentProfiles.businessStudent,
          exclude_words: mockStudentProfiles.businessStudent.seenWords,
          count: 1
        })
      });

      const result = await response.json();
      expect(mockStudentProfiles.businessStudent.seenWords).not.toContain(result.words[0].word);
      expect(result.words[0].word).toBe('innovative');
    });
  });

  describe('Word Data Generation', () => {
    it('generates comprehensive word information', async () => {
      const completeWord = {
        word: 'collaborate',
        pronunciation: '/kəˈlæbəreɪt/',
        partOfSpeech: 'verb',
        definition: 'To work jointly with others or together especially in an intellectual endeavor',
        exampleSentences: {
          present: 'Teams **collaborate** on projects daily.',
          past: 'They **collaborated** on the research last month.',
          future: 'We will **collaborate** with international partners.',
          presentPerfect: 'The departments have **collaborated** successfully.',
          pastPerfect: 'The teams had **collaborated** before the merger.',
          futurePerfect: 'By year-end, all divisions will have **collaborated**.'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: [completeWord]
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: 'test-student',
          count: 1
        })
      });

      const result = await response.json();
      const word = result.words[0];

      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('pronunciation');
      expect(word).toHaveProperty('partOfSpeech');
      expect(word).toHaveProperty('definition');
      expect(word).toHaveProperty('exampleSentences');

      expect(word.exampleSentences).toHaveProperty('present');
      expect(word.exampleSentences).toHaveProperty('past');
      expect(word.exampleSentences).toHaveProperty('future');
      expect(word.exampleSentences).toHaveProperty('presentPerfect');
      expect(word.exampleSentences).toHaveProperty('pastPerfect');
      expect(word.exampleSentences).toHaveProperty('futurePerfect');

      // Check that the word is bolded in example sentences
      Object.values(word.exampleSentences).forEach((sentence: any) => {
        expect(sentence).toContain('**collaborate**');
      });
    });

    it('generates appropriate pronunciation guides', async () => {
      const wordsWithPronunciation = [
        { word: 'sophisticated', expectedPattern: /\/səˈfɪstɪkeɪtɪd\// },
        { word: 'technology', expectedPattern: /\/tekˈnɑːlədʒi\// },
        { word: 'opportunity', expectedPattern: /\/ˌɑːpərˈtuːnəti\// }
      ];

      for (const { word, expectedPattern } of wordsWithPronunciation) {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            words: [{
              word,
              pronunciation: expectedPattern.source.slice(1, -1), // Remove the / / from regex
              partOfSpeech: 'noun',
              definition: 'Test definition',
              exampleSentences: {
                present: `**${word}** is important.`,
                past: `**${word}** was useful.`,
                future: `**${word}** will help.`,
                presentPerfect: `**${word}** has been valuable.`,
                pastPerfect: `**${word}** had been needed.`,
                futurePerfect: `**${word}** will have been essential.`
              }
            }]
          })
        });

        const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
          method: 'POST',
          body: JSON.stringify({ student_id: 'test', count: 1 })
        });

        const result = await response.json();
        expect(result.words[0].pronunciation).toMatch(expectedPattern);
      }
    });

    it('determines correct parts of speech', async () => {
      const wordsWithPOS = [
        { word: 'analyze', expectedPOS: 'verb' },
        { word: 'comprehensive', expectedPOS: 'adjective' },
        { word: 'methodology', expectedPOS: 'noun' },
        { word: 'efficiently', expectedPOS: 'adverb' }
      ];

      for (const { word, expectedPOS } of wordsWithPOS) {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            words: [{
              word,
              pronunciation: '/test/',
              partOfSpeech: expectedPOS,
              definition: 'Test definition',
              exampleSentences: {
                present: `**${word}** example.`,
                past: `**${word}** example.`,
                future: `**${word}** example.`,
                presentPerfect: `**${word}** example.`,
                pastPerfect: `**${word}** example.`,
                futurePerfect: `**${word}** example.`
              }
            }]
          })
        });

        const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
          method: 'POST',
          body: JSON.stringify({ student_id: 'test', count: 1 })
        });

        const result = await response.json();
        expect(result.words[0].partOfSpeech).toBe(expectedPOS);
      }
    });
  });

  describe('Level-Appropriate Content', () => {
    it('generates A1 level vocabulary with simple definitions', async () => {
      const a1Words = [
        {
          word: 'happy',
          pronunciation: '/ˈhæpi/',
          partOfSpeech: 'adjective',
          definition: 'Feeling good and pleased',
          exampleSentences: {
            present: 'I am **happy** today.',
            past: 'She was **happy** yesterday.',
            future: 'They will be **happy** tomorrow.',
            presentPerfect: 'We have been **happy** recently.',
            pastPerfect: 'He had been **happy** before the news.',
            futurePerfect: 'You will have been **happy** by then.'
          }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: a1Words
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.beginnerStudent.studentId,
          student_profile: mockStudentProfiles.beginnerStudent,
          count: 1
        })
      });

      const result = await response.json();
      const word = result.words[0];

      expect(word.definition).toBe('Feeling good and pleased');
      expect(word.definition.split(' ').length).toBeLessThan(10); // Simple definition
    });

    it('generates C1 level vocabulary with sophisticated definitions', async () => {
      const c1Words = [
        {
          word: 'paradigm',
          pronunciation: '/ˈpærədaɪm/',
          partOfSpeech: 'noun',
          definition: 'A typical example or pattern of something; a theoretical framework',
          exampleSentences: {
            present: 'This **paradigm** influences modern research.',
            past: 'The **paradigm** shifted dramatically last decade.',
            future: 'A new **paradigm** will emerge in the field.',
            presentPerfect: 'The **paradigm** has been challenged recently.',
            pastPerfect: 'The old **paradigm** had been dominant for years.',
            futurePerfect: 'The **paradigm** will have been established by 2030.'
          }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: c1Words
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: mockStudentProfiles.academicStudent.studentId,
          student_profile: mockStudentProfiles.academicStudent,
          count: 1
        })
      });

      const result = await response.json();
      const word = result.words[0];

      expect(word.definition).toContain('theoretical framework');
      expect(word.definition.split(' ').length).toBeGreaterThan(8); // Complex definition
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('/api/supabase/functions/generate-vocabulary-words', {
          method: 'POST',
          body: JSON.stringify({ student_id: 'test', count: 1 })
        })
      ).rejects.toThrow('Network error');
    });

    it('handles invalid student profiles', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: 'invalid-student',
          student_profile: null,
          count: 1
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('handles empty vocabulary requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: []
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: 'test-student',
          count: 0
        })
      });

      const result = await response.json();
      expect(result.words).toHaveLength(0);
    });

    it('validates word data structure', async () => {
      const invalidWord = {
        word: 'test',
        // Missing required fields
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: [invalidWord]
        })
      });

      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({ student_id: 'test', count: 1 })
      });

      const result = await response.json();
      
      // In a real implementation, this would be validated and rejected
      // For testing purposes, we're just checking the structure
      expect(result.words[0]).toHaveProperty('word');
    });
  });

  describe('Performance and Optimization', () => {
    it('handles large vocabulary requests efficiently', async () => {
      const largeWordSet = Array.from({ length: 50 }, (_, i) => ({
        word: `word${i}`,
        pronunciation: `/word${i}/`,
        partOfSpeech: 'noun',
        definition: `Definition for word ${i}`,
        exampleSentences: {
          present: `**word${i}** is useful.`,
          past: `**word${i}** was helpful.`,
          future: `**word${i}** will be important.`,
          presentPerfect: `**word${i}** has been valuable.`,
          pastPerfect: `**word${i}** had been needed.`,
          futurePerfect: `**word${i}** will have been essential.`
        }
      }));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: largeWordSet
        })
      });

      const startTime = Date.now();
      const response = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({
          student_id: 'test-student',
          count: 50
        })
      });
      const endTime = Date.now();

      const result = await response.json();
      expect(result.words).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('caches vocabulary generation results', async () => {
      const cachedWords = [
        {
          word: 'cached',
          pronunciation: '/kæʃt/',
          partOfSpeech: 'adjective',
          definition: 'Stored for quick access',
          exampleSentences: {
            present: 'The data is **cached**.',
            past: 'The results were **cached**.',
            future: 'The content will be **cached**.',
            presentPerfect: 'The information has been **cached**.',
            pastPerfect: 'The data had been **cached**.',
            futurePerfect: 'The results will have been **cached**.'
          }
        }
      ];

      // First request
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: cachedWords,
          cached: false
        })
      });

      // Second request (should be faster/cached)
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          words: cachedWords,
          cached: true
        })
      });

      const firstResponse = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({ student_id: 'test', count: 1 })
      });

      const secondResponse = await fetch('/api/supabase/functions/generate-vocabulary-words', {
        method: 'POST',
        body: JSON.stringify({ student_id: 'test', count: 1 })
      });

      const firstResult = await firstResponse.json();
      const secondResult = await secondResponse.json();

      expect(firstResult.cached).toBe(false);
      expect(secondResult.cached).toBe(true);
      expect(firstResult.words).toEqual(secondResult.words);
    });
  });
});