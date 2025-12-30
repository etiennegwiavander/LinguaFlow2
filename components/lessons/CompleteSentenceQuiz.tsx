"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SentenceQuestion {
  sentence: string;
  options: string[];
  answer: string;
}

interface CompleteSentenceQuizProps {
  items: SentenceQuestion[];
  isKidsTemplate?: boolean;
}

export default function CompleteSentenceQuiz({ items, isKidsTemplate = false }: CompleteSentenceQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [scrambledQuestions, setScrambledQuestions] = useState<SentenceQuestion[]>([]);

  // Scramble options for each question on mount
  useEffect(() => {
    const questionsWithScrambledOptions = items.map(question => ({
      ...question,
      options: [...question.options].sort(() => Math.random() - 0.5)
    }));
    setScrambledQuestions(questionsWithScrambledOptions);
  }, [items]);

  const handleOptionClick = (questionIndex: number, option: string) => {
    // If already revealed, don't allow changes
    if (revealedAnswers[questionIndex]) return;

    const question = scrambledQuestions[questionIndex];
    const isCorrect = option === question.answer;

    // Mark as revealed
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
    // Re-scramble options
    const questionsWithScrambledOptions = items.map(question => ({
      ...question,
      options: [...question.options].sort(() => Math.random() - 0.5)
    }));
    setScrambledQuestions(questionsWithScrambledOptions);
  };

  const isComplete = Object.keys(revealedAnswers).length === scrambledQuestions.length;
  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  const getOptionClasses = (questionIndex: number, option: string) => {
    const isSelected = selectedAnswers[questionIndex] === option;
    const isRevealed = revealedAnswers[questionIndex];
    const question = scrambledQuestions[questionIndex];
    const isCorrect = option === question.answer;

    const baseClasses = isKidsTemplate
      ? 'px-6 py-4 rounded-2xl border-4 font-semibold text-lg transition-all duration-200 cursor-pointer'
      : 'px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer';

    if (isRevealed) {
      if (isSelected) {
        // Show if the selected answer was correct or wrong
        if (isCorrect) {
          return `${baseClasses} bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200 cursor-not-allowed`;
        } else {
          return `${baseClasses} bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200 cursor-not-allowed animate-shake`;
        }
      } else if (isCorrect) {
        // Show the correct answer even if not selected
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200 cursor-not-allowed`;
      } else {
        // Other options - grayed out
        return `${baseClasses} bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed opacity-50`;
      }
    }

    // Not revealed yet - hoverable
    return `${baseClasses} ${isKidsTemplate
      ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 hover:shadow-xl hover:scale-105'
      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:shadow-md hover:border-blue-300'
    }`;
  };

  if (scrambledQuestions.length === 0) {
    return <div className="text-center py-4">Loading quiz...</div>;
  }

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl ${isKidsTemplate 
        ? 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-300' 
        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'
      }`}>
        <p className={`${isKidsTemplate ? 'text-lg font-semibold' : 'text-base'} text-center text-gray-700 dark:text-gray-300`}>
          {isKidsTemplate ? '🎯 ' : ''}
          Choose the correct word to complete each sentence!
          {isKidsTemplate ? ' 🎯' : ''}
        </p>
      </div>

      <div className="space-y-6">
        {scrambledQuestions.map((question, questionIndex) => {
          const isRevealed = revealedAnswers[questionIndex];
          const selectedAnswer = selectedAnswers[questionIndex];
          const isCorrect = selectedAnswer === question.answer;

          return (
            <div
              key={questionIndex}
              className={`p-6 rounded-2xl border-2 ${isKidsTemplate
                ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-pink-900/20 border-yellow-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Question Number and Status */}
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-2 ${isKidsTemplate ? 'text-xl font-black' : 'text-lg font-bold'}`}>
                  <span className={`${isKidsTemplate 
                    ? 'w-10 h-10 text-lg' 
                    : 'w-8 h-8 text-base'
                  } flex items-center justify-center rounded-full ${isKidsTemplate
                    ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  }`}>
                    {questionIndex + 1}
                  </span>
                </div>
                {isRevealed && (
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className={`${isKidsTemplate ? 'w-8 h-8' : 'w-6 h-6'} text-green-600`} />
                        {isKidsTemplate && <span className="text-2xl">✨</span>}
                      </>
                    ) : (
                      <>
                        <XCircle className={`${isKidsTemplate ? 'w-8 h-8' : 'w-6 h-6'} text-red-600`} />
                        {isKidsTemplate && <span className="text-2xl">💭</span>}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Sentence with blank */}
              <div className={`mb-6 ${isKidsTemplate ? 'text-xl font-semibold' : 'text-lg'} text-gray-800 dark:text-gray-200`}>
                {question.sentence.split('_____').map((part, index, array) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < array.length - 1 && (
                      <span className={`inline-block mx-2 px-4 py-1 ${isKidsTemplate
                        ? 'border-b-4 border-dashed border-purple-400 min-w-[120px]'
                        : 'border-b-2 border-dashed border-gray-400 min-w-[100px]'
                      } text-center`}>
                        {isRevealed ? (
                          <span className={isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {selectedAnswer}
                          </span>
                        ) : (
                          <span className="text-gray-400">?</span>
                        )}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {question.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => handleOptionClick(questionIndex, option)}
                    disabled={isRevealed}
                    className={getOptionClasses(questionIndex, option)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isRevealed && option === question.answer && (
                        <CheckCircle2 className={`${isKidsTemplate ? 'w-6 h-6' : 'w-5 h-5'} text-green-600 flex-shrink-0 ml-2`} />
                      )}
                      {isRevealed && selectedAnswer === option && option !== question.answer && (
                        <XCircle className={`${isKidsTemplate ? 'w-6 h-6' : 'w-5 h-5'} text-red-600 flex-shrink-0 ml-2`} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Section */}
      <div className={`p-6 rounded-2xl ${isKidsTemplate
        ? 'bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-pink-900/30 border-4 border-yellow-400'
        : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-300'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`${isKidsTemplate ? 'text-sm font-bold' : 'text-xs'} text-gray-600 dark:text-gray-400 uppercase tracking-wide`}>
                Score
              </p>
              <p className={`${isKidsTemplate ? 'text-3xl font-black' : 'text-2xl font-bold'} ${isComplete ? 'text-green-600' : 'text-purple-600'}`}>
                {score} / {scrambledQuestions.length}
              </p>
            </div>

            <div className="text-center">
              <p className={`${isKidsTemplate ? 'text-sm font-bold' : 'text-xs'} text-gray-600 dark:text-gray-400 uppercase tracking-wide`}>
                Accuracy
              </p>
              <p className={`${isKidsTemplate ? 'text-3xl font-black' : 'text-2xl font-bold'} ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                {accuracy}%
              </p>
            </div>

            {isComplete && (
              <div className="flex items-center gap-2">
                <Trophy className={`${isKidsTemplate ? 'w-12 h-12' : 'w-10 h-10'} text-yellow-500 animate-bounce`} />
                <span className={`${isKidsTemplate ? 'text-2xl font-black' : 'text-xl font-bold'} text-green-600`}>
                  Complete!
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={resetQuiz}
            variant="outline"
            className={`${isKidsTemplate 
              ? 'px-6 py-3 text-lg font-bold rounded-xl border-3' 
              : 'px-4 py-2'
            } flex items-center gap-2`}
          >
            <RotateCcw className={isKidsTemplate ? 'w-6 h-6' : 'w-4 h-4'} />
            {isKidsTemplate ? 'Try Again!' : 'Reset'}
          </Button>
        </div>
      </div>

      {isComplete && (
        <div className={`p-6 rounded-2xl text-center ${isKidsTemplate
          ? 'bg-gradient-to-r from-green-100 via-teal-100 to-cyan-100 dark:from-green-900/30 dark:via-teal-900/30 dark:to-cyan-900/30 border-4 border-green-400'
          : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300'
        }`}>
          <p className={`${isKidsTemplate ? 'text-2xl font-black' : 'text-xl font-bold'} text-green-700 dark:text-green-300 mb-2`}>
            {isKidsTemplate ? '🎉 ' : ''}
            Excellent Work!
            {isKidsTemplate ? ' 🎉' : ''}
          </p>
          <p className={`${isKidsTemplate ? 'text-lg' : 'text-base'} text-gray-700 dark:text-gray-300`}>
            You completed all {scrambledQuestions.length} sentences with {accuracy}% accuracy!
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
