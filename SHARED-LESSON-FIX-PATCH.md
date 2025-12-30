# Shared Lesson Content Types - Manual Patch Guide

## Overview
This guide will help you manually add the missing content type handlers to `app/shared-lesson/[id]/page.tsx`.

## Prerequisites
- Open `app/shared-lesson/[id]/page.tsx` in your editor
- Find the `renderExerciseContent` function (around line 300-1000)
- Locate the `switch (contentType)` statement

## Changes to Apply

### Change 1: Add Answer Key to fill_in_the_blanks_dialogue

**Location**: Find the `case 'fill_in_the_blanks_dialogue':` section

**What to find**: Look for the closing of this case, which should end with something like:
```typescript
            })}
          </div>
        );
      }
```

**What to add**: BEFORE the closing `</div>` and `);`, add this code:

```typescript
            {/* Answer Key Section */}
            {(() => {
              // Extract missing words for answer key
              const missingWords: string[] = [];
              dialogueElements.forEach((element) => {
                if (element && typeof element === 'object') {
                  const missingWord = safeGetString(element, 'missing_word', '');
                  if (missingWord) {
                    missingWords.push(missingWord);
                  }
                }
              });

              const shuffledAnswers = [...missingWords].sort(() => Math.random() - 0.5);

              if (shuffledAnswers.length === 0) return null;

              return (
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
              );
            })()}
```

---

### Change 2: Add vocabulary_translation_match Case

**Location**: Find where the cases end (before the `default:` case or at the end of the switch statement)

**What to add**: Add this new case:

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

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item: any, index: number) => (
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
```

---

### Change 3: Add listen_repeat Case

**What to add**: Add this new case:

```typescript
      case 'listen_repeat': {
        const aiPlaceholderKey = safeGetString(section, 'ai_placeholder');
        let items = safeGetArray(section, 'items');
        
        // Check if AI filled the placeholder field
        if (items.length === 0 && aiPlaceholderKey) {
          if (aiPlaceholderKey.length < 100) {
            const aiContent = (section as any)[aiPlaceholderKey];
            if (aiContent) {
              if (Array.isArray(aiContent)) {
                items = aiContent;
              } else if (typeof aiContent === 'string') {
                items = aiContent.split('\n').filter(line => line.trim());
              }
            }
          }
        }
        
        if (items.length === 0) {
          return (
            <div className="text-center py-4 text-gray-500">
              <p>No sentences available for this exercise.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {items.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-gray-800 dark:text-gray-200">{safeStringify(item)}</span>
              </div>
            ))}
          </div>
        );
      }
```

---

### Change 4: Add complete_sentence Case

**What to add**: Add this new case:

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

        return (
          <div className="space-y-4">
            {items.map((item: any, index: number) => {
              const sentence = safeGetString(item, 'sentence', '');
              const options = safeGetArray(item, 'options');
              
              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <p className="font-medium mb-3 text-gray-900 dark:text-gray-100">{sentence}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((option: any, optIndex: number) => (
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
```

---

## Verification Steps

After applying all changes:

1. Save the file
2. Check for TypeScript errors
3. Test by:
   - Generating a new lesson
   - Sharing it with a student
   - Opening the shared link
   - Verifying all sections display correctly

## Expected Result

All four sections should now display properly:
- ✅ Warm-up (vocabulary_translation_match)
- ✅ Listen and Repeat (listen_repeat)
- ✅ Fill in the Blanks (with answer key at bottom)
- ✅ Complete the Sentence (with options)

## Need Help?

If you encounter any issues:
1. Check the console for errors
2. Verify the case names match exactly
3. Ensure proper indentation
4. Make sure all brackets are balanced

---

**Date**: December 30, 2025
**File**: app/shared-lesson/[id]/page.tsx
