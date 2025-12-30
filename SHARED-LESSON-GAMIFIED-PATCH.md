# Shared Lesson - Gamified Experience Patch

## Overview
This patch adds the gamified matching quiz for Warm-up and the interactive quiz for Complete the Sentence sections in the shared lesson view.

## Prerequisites
- You've already applied the basic content type handlers from SHARED-LESSON-FIX-PATCH.md
- Open `app/shared-lesson/[id]/page.tsx` in your editor

---

## Change 1: Replace vocabulary_translation_match with Gamified Matching Quiz

**Location**: Find the `case 'vocabulary_translation_match':` section you added earlier

**Replace the entire case with**:

```typescript
      case 'vocabulary_translation_match': {
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let items = safeGetArray(section, 'items');
        
        // Check if AI filled the placeholder field
        if (items.length === 0 && aiPlaceholderKey) {
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent && Array.isArray(aiContent)) {
              items = aiContent;
            }
          }
        }
        
        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No vocabulary translation items available.</p>
            </div>
          );
        }

        // Gamified Matching Quiz Component (inline)
        const VocabularyMatchingGame = () => {
          const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
          const [selectedTranslation, setSelectedTranslation] = useState<number | null>(null);
          const [matchedEnglish, setMatchedEnglish] = useState<number[]>([]);
          const [matchedTranslation, setMatchedTranslation] = useState<number[]>([]);
          const [incorrectPair, setIncorrectPair] = useState<string | null>(null);
          const [score, setScore] = useState(0);
          const [attempts, setAttempts] = useState(0);
          const [scrambledTranslations, setScrambledTranslations] = useState<any[]>([]);

          useEffect(() => {
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            setScrambledTranslations(shuffled);
          }, []);

          useEffect(() => {
            if (selectedEnglish === null || selectedTranslation === null) return;
            if (matchedEnglish.includes(selectedEnglish) || matchedTranslation.includes(selectedTranslation)) return;

            const englishWord = items[selectedEnglish];
            const translationWord = scrambledTranslations[selectedTranslation];
            
            const isMatch = 
              safeGetString(englishWord, 'word', '') === safeGetString(translationWord, 'word', '') && 
              safeGetString(englishWord, 'translation', '') === safeGetString(translationWord, 'translation', '');

            if (isMatch) {
              setMatchedEnglish(prev => [...prev, selectedEnglish]);
              setMatchedTranslation(prev => [...prev, selectedTranslation]);
              setScore(prev => prev + 1);
              setAttempts(prev => prev + 1);
              setSelectedEnglish(null);
              setSelectedTranslation(null);
              setIncorrectPair(null);
            } else {
              const pairKey = `${selectedEnglish}-${selectedTranslation}`;
              setIncorrectPair(pairKey);
              setAttempts(prev => prev + 1);
              setSelectedEnglish(null);
              setSelectedTranslation(null);
              setTimeout(() => setIncorrectPair(null), 1000);
            }
          }, [selectedEnglish, selectedTranslation]);

          const handleEnglishClick = (index: number) => {
            if (matchedEnglish.includes(index)) return;
            setSelectedEnglish(selectedEnglish === index ? null : index);
          };

          const handleTranslationClick = (index: number) => {
            if (matchedTranslation.includes(index)) return;
            setSelectedTranslation(selectedTranslation === index ? null : index);
          };

          const resetGame = () => {
            setSelectedEnglish(null);
            setSelectedTranslation(null);
            setMatchedEnglish([]);
            setMatchedTranslation([]);
            setIncorrectPair(null);
            setScore(0);
            setAttempts(0);
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            setScrambledTranslations(shuffled);
          };

          const isComplete = matchedEnglish.length === items.length;
          const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

          const getCardClasses = (index: number, isEnglish: boolean) => {
            const isMatched = isEnglish ? matchedEnglish.includes(index) : matchedTranslation.includes(index);
            const isSelected = isEnglish ? selectedEnglish === index : selectedTranslation === index;
            const pairKey = isEnglish ? `${index}-${selectedTranslation}` : `${selectedEnglish}-${index}`;
            const isIncorrect = incorrectPair === pairKey;

            let classes = 'p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer text-center ';
            
            if (isMatched) {
              classes += 'bg-green-100 dark:bg-green-900/30 border-green-500 opacity-50 cursor-not-allowed';
            } else if (isIncorrect) {
              classes += 'bg-red-100 dark:bg-red-900/30 border-red-500 animate-shake';
            } else if (isSelected) {
              classes += 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 scale-105 shadow-lg';
            } else {
              classes += 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:shadow-md';
            }
            
            return classes;
          };

          return (
            <div className="space-y-6">
              {/* Score Display */}
              {attempts > 0 && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score}/{items.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Matched</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy}%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Accuracy</div>
                    </div>
                  </div>
                  {isComplete && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <span className="font-semibold text-green-600 dark:text-green-400">Complete!</span>
                    </div>
                  )}
                  <Button onClick={resetGame} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}

              {/* Matching Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* English Words Column */}
                <div>
                  <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">English</h4>
                  <div className="space-y-2">
                    {items.map((item: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => handleEnglishClick(index)}
                        className={getCardClasses(index, true)}
                      >
                        <span className="font-semibold">{safeGetString(item, 'word', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Translations Column */}
                <div>
                  <h4 className="font-semibold mb-3 text-indigo-900 dark:text-indigo-100">Translation</h4>
                  <div className="space-y-2">
                    {scrambledTranslations.map((item: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => handleTranslationClick(index)}
                        className={getCardClasses(index, false)}
                      >
                        <span>{safeGetString(item, 'translation', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>How to play:</strong> Click on an English word, then click on its matching translation. Match all pairs to complete the exercise!
                </p>
              </div>
            </div>
          );
        };

        return <VocabularyMatchingGame />;
      }
```

---

## Change 2: Replace complete_sentence with Gamified Quiz

**Location**: Find the `case 'complete_sentence':` section you added earlier

**Replace the entire case with**:

```typescript
      case 'complete_sentence': {
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let items = safeGetArray(section, 'items');
        
        // Check if AI filled the placeholder field
        if (items.length === 0 && aiPlaceholderKey) {
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent && Array.isArray(aiContent)) {
              items = aiContent;
            }
          }
        }
        
        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No sentence completion questions available.</p>
            </div>
          );
        }

        // Gamified Complete Sentence Quiz Component (inline)
        const CompleteSentenceGame = () => {
          const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
          const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
          const [score, setScore] = useState(0);
          const [attempts, setAttempts] = useState(0);
          const [scrambledQuestions, setScrambledQuestions] = useState<any[]>([]);

          useEffect(() => {
            const questionsWithScrambledOptions = items.map((question: any) => ({
              ...question,
              options: [...safeGetArray(question, 'options')].sort(() => Math.random() - 0.5)
            }));
            setScrambledQuestions(questionsWithScrambledOptions);
          }, []);

          const handleOptionClick = (questionIndex: number, option: string) => {
            if (revealedAnswers[questionIndex]) return;

            const question = scrambledQuestions[questionIndex];
            const isCorrect = option === safeGetString(question, 'answer', '');

            setRevealedAnswers(prev => ({ ...prev, [questionIndex]: true }));
            setSelectedAnswers(prev => ({ ...prev, [questionIndex]: option }));
            setAttempts(prev => prev + 1);

            if (isCorrect) {
              setScore(prev => prev + 1);
            }
          };

          const resetQuiz = () => {
            setSelectedAnswers({});
            setRevealedAnswers({});
            setScore(0);
            setAttempts(0);
            const questionsWithScrambledOptions = items.map((question: any) => ({
              ...question,
              options: [...safeGetArray(question, 'options')].sort(() => Math.random() - 0.5)
            }));
            setScrambledQuestions(questionsWithScrambledOptions);
          };

          const isComplete = Object.keys(revealedAnswers).length === scrambledQuestions.length;
          const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

          const getOptionClasses = (questionIndex: number, option: string) => {
            const isSelected = selectedAnswers[questionIndex] === option;
            const isRevealed = revealedAnswers[questionIndex];
            const question = scrambledQuestions[questionIndex];
            const isCorrect = option === safeGetString(question, 'answer', '');

            let classes = 'px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer text-center ';

            if (isRevealed) {
              if (isSelected) {
                if (isCorrect) {
                  classes += 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100';
                } else {
                  classes += 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-100';
                }
              } else if (isCorrect) {
                classes += 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
              } else {
                classes += 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50';
              }
            } else {
              classes += 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20';
            }

            return classes;
          };

          return (
            <div className="space-y-6">
              {/* Score Display */}
              {attempts > 0 && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{score}/{scrambledQuestions.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{accuracy}%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Accuracy</div>
                    </div>
                  </div>
                  {isComplete && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <span className="font-semibold text-green-600 dark:text-green-400">Complete!</span>
                    </div>
                  )}
                  <Button onClick={resetQuiz} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-6">
                {scrambledQuestions.map((question: any, questionIndex: number) => {
                  const sentence = safeGetString(question, 'sentence', '');
                  const options = safeGetArray(question, 'options');
                  const isRevealed = revealedAnswers[questionIndex];
                  const selectedAnswer = selectedAnswers[questionIndex];
                  const correctAnswer = safeGetString(question, 'answer', '');

                  return (
                    <div key={questionIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-start gap-2 mb-4">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {questionIndex + 1}
                        </span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 flex-1">{sentence}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {options.map((option: any, optIndex: number) => (
                          <div
                            key={optIndex}
                            onClick={() => handleOptionClick(questionIndex, safeStringify(option))}
                            className={getOptionClasses(questionIndex, safeStringify(option))}
                          >
                            {safeStringify(option)}
                            {isRevealed && selectedAnswer === safeStringify(option) && (
                              <span className="ml-2">
                                {safeStringify(option) === correctAnswer ? (
                                  <CheckCircle2 className="w-4 h-4 inline text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 inline text-red-600" />
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions */}
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  💡 <strong>How to play:</strong> Read each sentence and click on the correct word to complete it. Your answer will be revealed immediately!
                </p>
              </div>
            </div>
          );
        };

        return <CompleteSentenceGame />;
      }
```

---

## Important Notes

1. **useState and useEffect**: These are already imported at the top of the file, so no need to add imports
2. **Icons**: Make sure `Trophy`, `RotateCcw`, `CheckCircle2`, and `XCircle` are imported from 'lucide-react'
3. **Button**: Make sure the Button component is imported from '@/components/ui/button'

## Verification

After applying these changes:
1. Save the file
2. Share a lesson with a student
3. Open the shared link
4. Test both sections:
   - **Warm-up**: Should have clickable matching cards with score tracking
   - **Complete the Sentence**: Should have clickable options with instant feedback

## Expected Features

### Warm-up (Vocabulary Matching)
- ✅ Click to select English word
- ✅ Click to select translation
- ✅ Automatic matching validation
- ✅ Visual feedback (green for correct, red for incorrect)
- ✅ Score and accuracy tracking
- ✅ Reset button to try again

### Complete the Sentence
- ✅ Click to select answer
- ✅ Instant feedback (green checkmark or red X)
- ✅ Shows correct answer if wrong
- ✅ Score and accuracy tracking
- ✅ Reset button to try again
- ✅ Trophy icon when complete

---

**Date**: December 30, 2025
**File**: app/shared-lesson/[id]/page.tsx
