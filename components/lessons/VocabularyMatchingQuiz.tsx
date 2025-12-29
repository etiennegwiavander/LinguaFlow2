"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VocabularyPair {
  english: string;
  translation: string;
}

interface VocabularyMatchingQuizProps {
  items: VocabularyPair[];
  isKidsTemplate?: boolean;
}

export default function VocabularyMatchingQuiz({ items, isKidsTemplate = false }: VocabularyMatchingQuizProps) {
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<number | null>(null);
  const [matchedEnglish, setMatchedEnglish] = useState<number[]>([]);
  const [matchedTranslation, setMatchedTranslation] = useState<number[]>([]);
  const [incorrectPair, setIncorrectPair] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [scrambledTranslations, setScrambledTranslations] = useState<VocabularyPair[]>([]);
  
  const incorrectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false); // Prevent double processing

  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setScrambledTranslations(shuffled);
  }, [items]);

  useEffect(() => {
    return () => {
      if (incorrectTimeoutRef.current) {
        clearTimeout(incorrectTimeoutRef.current);
      }
    };
  }, []);

  // Effect to check match when both are selected
  useEffect(() => {
    if (selectedEnglish === null || selectedTranslation === null) return;
    if (matchedEnglish.includes(selectedEnglish) || matchedTranslation.includes(selectedTranslation)) return;
    if (processingRef.current) return; // Already processing

    processingRef.current = true;

    // Both selected, check if they match
    const englishWord = items[selectedEnglish];
    const translationWord = scrambledTranslations[selectedTranslation];
    
    // CORRECT COMPARISON: Both english AND translation must match (they're the same pair)
    const isMatch = 
      englishWord.english === translationWord.english && 
      englishWord.translation === translationWord.translation;

    if (isMatch) {
      // Correct match!
      setMatchedEnglish(prev => [...prev, selectedEnglish]);
      setMatchedTranslation(prev => [...prev, selectedTranslation]);
      setScore(prev => prev + 1);
      setAttempts(prev => prev + 1);
      setSelectedEnglish(null);
      setSelectedTranslation(null);
      setIncorrectPair(null);
      processingRef.current = false;
    } else {
      // Incorrect match
      const pairKey = `${selectedEnglish}-${selectedTranslation}`;
      setIncorrectPair(pairKey);
      setAttempts(prev => prev + 1);
      setSelectedEnglish(null);
      setSelectedTranslation(null);

      // Clear incorrect timeout if exists
      if (incorrectTimeoutRef.current) {
        clearTimeout(incorrectTimeoutRef.current);
      }

      // Clear incorrect state after 1 second
      incorrectTimeoutRef.current = setTimeout(() => {
        setIncorrectPair(null);
        processingRef.current = false;
      }, 1000);
    }
  }, [selectedEnglish, selectedTranslation, items, scrambledTranslations, matchedEnglish, matchedTranslation]);

  const handleEnglishClick = (index: number) => {
    if (matchedEnglish.includes(index)) return;

    // Toggle selection
    if (selectedEnglish === index) {
      setSelectedEnglish(null);
    } else {
      setSelectedEnglish(index);
    }
  };

  const handleTranslationClick = (index: number) => {
    if (matchedTranslation.includes(index)) return;

    // Toggle selection
    if (selectedTranslation === index) {
      setSelectedTranslation(null);
    } else {
      setSelectedTranslation(index);
    }
  };

  const resetQuiz = () => {
    if (incorrectTimeoutRef.current) {
      clearTimeout(incorrectTimeoutRef.current);
    }
    
    processingRef.current = false;
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
    
    const isIncorrect = incorrectPair !== null && (() => {
      const [engIdx, transIdx] = incorrectPair.split('-').map(Number);
      return isEnglish ? engIdx === index : transIdx === index;
    })();

    const baseClasses = isKidsTemplate
      ? 'p-4 rounded-2xl border-4 font-semibold text-lg transition-all duration-200 cursor-pointer'
      : 'p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer';

    if (isMatched) {
      return `${baseClasses} bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200 cursor-not-allowed`;
    }

    if (isIncorrect) {
      return `${baseClasses} bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200 animate-shake`;
    }

    if (isSelected) {
      return `${baseClasses} ${isKidsTemplate 
        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 shadow-lg scale-105' 
        : 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 shadow-md scale-105'
      }`;
    }

    return `${baseClasses} ${isKidsTemplate
      ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 hover:shadow-xl hover:scale-105'
      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:shadow-md hover:border-blue-300'
    }`;
  };

  if (scrambledTranslations.length === 0) {
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
          Click a word on the left, then click its matching translation on the right!
          {isKidsTemplate ? ' 🎯' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className={`${isKidsTemplate ? 'text-xl font-black' : 'text-lg font-bold'} text-center text-purple-600 dark:text-purple-400 mb-4`}>
            {isKidsTemplate ? '🇬🇧 ' : ''}English{isKidsTemplate ? ' 🇬🇧' : ''}
          </h3>
          {items.map((item, index) => (
            <div
              key={`english-${index}`}
              onClick={() => handleEnglishClick(index)}
              className={getCardClasses(index, true)}
            >
              <div className="flex items-center justify-between">
                <span className={`${isKidsTemplate ? 'text-lg' : 'text-base'}`}>
                  {item.english}
                </span>
                {matchedEnglish.includes(index) && (
                  <CheckCircle2 className={`${isKidsTemplate ? 'w-6 h-6' : 'w-5 h-5'} text-green-600 flex-shrink-0 ml-2`} />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className={`${isKidsTemplate ? 'text-xl font-black' : 'text-lg font-bold'} text-center text-pink-600 dark:text-pink-400 mb-4`}>
            {isKidsTemplate ? '🌍 ' : ''}Translation{isKidsTemplate ? ' 🌍' : ''}
          </h3>
          {scrambledTranslations.map((item, index) => (
            <div
              key={`translation-${index}`}
              onClick={() => handleTranslationClick(index)}
              className={getCardClasses(index, false)}
            >
              <div className="flex items-center justify-between">
                <span className={`${isKidsTemplate ? 'text-lg' : 'text-base'}`}>
                  {item.translation}
                </span>
                {matchedTranslation.includes(index) && (
                  <CheckCircle2 className={`${isKidsTemplate ? 'w-6 h-6' : 'w-5 h-5'} text-green-600 flex-shrink-0 ml-2`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                {score} / {items.length}
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
            {isKidsTemplate ? 'Play Again!' : 'Reset'}
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
            You matched all {items.length} words with {accuracy}% accuracy!
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
