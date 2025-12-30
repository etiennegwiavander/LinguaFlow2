const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// This script documents the required changes to app/shared-lesson/[id]/page.tsx
// Due to file size, manual application is recommended

console.log('📋 Required Changes for Shared Lesson Page');
console.log('='.repeat(60));
console.log('');
console.log('File: app/shared-lesson/[id]/page.tsx');
console.log('');
console.log('CHANGES NEEDED:');
console.log('');

console.log('1. UPDATE fill_in_the_blanks_dialogue case to add answer key at bottom:');
console.log('');
console.log('   Add BEFORE the closing </div> of the case:');
console.log('');
console.log(`
      // Extract missing words for answer key
      const missingWords = [];
      dialogueElements.forEach((element) => {
        if (element && typeof element === 'object') {
          const missingWord = safeGetString(element, 'missing_word', '');
          if (missingWord) {
            missingWords.push(missingWord);
          }
        }
      });

      const shuffledAnswers = [...missingWords].sort(() => Math.random() - 0.5);

      // Add answer key at the bottom
      {shuffledAnswers.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg">
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
            <span className="text-lg">📝</span>
            Answer Key (Shuffled)
          </h4>
          <div className="flex flex-wrap gap-2">
            {shuffledAnswers.map((word, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 rounded-md text-sm font-medium text-indigo-700 dark:text-indigo-300 shadow-sm"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
`);

console.log('');
console.log('2. ADD vocabulary_translation_match case BEFORE the default case:');
console.log('');
console.log(`
      case 'vocabulary_translation_match': {
        const items = safeGetArray(section, 'items');
        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No vocabulary translation items available.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {safeGetString(item, 'word', '')}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {safeGetString(item, 'translation', '')}
                </div>
              </div>
            ))}
          </div>
        );
      }
`);

console.log('');
console.log('3. ADD listen_repeat case BEFORE the default case:');
console.log('');
console.log(`
      case 'listen_repeat': {
        const items = safeGetArray(section, 'items');
        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No sentences available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-gray-800 dark:text-gray-200">{safeStringify(item)}</span>
              </div>
            ))}
          </div>
        );
      }
`);

console.log('');
console.log('4. ADD complete_sentence case BEFORE the default case:');
console.log('');
console.log(`
      case 'complete_sentence': {
        const items = safeGetArray(section, 'items');
        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No sentence completion questions available.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {items.map((item, index) => {
              const sentence = safeGetString(item, 'sentence', '');
              const options = safeGetArray(item, 'options');
              
              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <p className="font-medium mb-3 text-gray-900 dark:text-gray-100">{sentence}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-center"
                      >
                        {safeStringify(option)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
`);

console.log('');
console.log('='.repeat(60));
console.log('');
console.log('✅ Apply these changes manually to app/shared-lesson/[id]/page.tsx');
console.log('');
console.log('Location: Find the renderExerciseContent function and add the cases');
console.log('          in the switch statement before the default case.');
console.log('');
