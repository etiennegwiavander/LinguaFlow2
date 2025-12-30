# Fill in the Blanks - Missing Words Fix

## Problem
The "Fill in the Blanks" section was displaying dialogue with blanks (represented by `_____`) but no answer key was shown at the bottom, making it very difficult for tutors to use the exercise effectively.

## Root Cause
1. The AI was generating dialogue with underscores `_____` as blanks
2. The component was only looking for words in brackets `[word]` format
3. There was no explicit field in the data structure to store the missing words
4. The AI prompt didn't instruct the model to provide the missing words separately

## Solution

### 1. Updated AI Prompt
Modified the Edge Function to instruct the AI to include a `missing_word` field for each dialogue element with a blank:

```typescript
14. For dialogue_elements in fill_in_the_blanks_dialogue, ensure each dialogue element has proper "character" and "text" fields. CRITICAL: Each dialogue element with a blank MUST also include a "missing_word" field containing the word that fills the blank. Use _____ (5 underscores) to indicate blanks in the text. Example:
   {
     "character": "Teacher",
     "text": "How are you _____ today?",
     "missing_word": "feeling"
   }
```

### 2. Updated Component Logic
Modified `LessonMaterialDisplay.tsx` to:
- Extract `missing_word` field from each dialogue element
- Fall back to bracket extraction `[word]` for backward compatibility
- Collect all missing words into an array
- Shuffle and display them at the bottom

### 3. Data Structure
Each dialogue element now includes:
```json
{
  "character": "Pierre",
  "text": "Oui, je l'ai fini hier. _____, c'était plus facile que je pensais.",
  "missing_word": "Heureusement"
}
```

## Expected Behavior

### Before Fix
- Dialogue displayed with `_____` blanks
- No answer options visible
- Tutors had to guess or manually create answer keys

### After Fix
- Dialogue displays with `_____` blanks
- Shuffled answer key appears at bottom in styled chips
- All missing words are clearly visible
- Easy for tutors to guide students

## Visual Example

```
┌─────────────────────────────────────────┐
│ Pierre: Salut test! Tu as fini ton      │
│         projet?                          │
│                                          │
│ test:   Oui, je l'ai fini hier. _____,  │
│         c'était plus facile que je       │
│         pensais.                         │
│                                          │
│ Pierre: Ah bon? _____, tu as besoin     │
│         d'aide pour autre chose?         │
│                                          │
│ 📝 Answer Key (Shuffled)                │
│ [Parfait] [Heureusement] [Maintenant]   │
└─────────────────────────────────────────┘
```

## Files Modified
1. `supabase/functions/generate-interactive-material/index.ts` - Updated AI prompt
2. `components/lessons/LessonMaterialDisplay.tsx` - Updated extraction logic

## Testing
1. Generate a new lesson with English for Kids B1 template
2. Check the "Fill in the Blanks" section
3. Verify that:
   - Dialogue displays with blanks
   - Answer key appears at bottom
   - Words are shuffled
   - All missing words are present

## Backward Compatibility
The component still supports the old bracket format `[word]` as a fallback, so existing lessons will continue to work (though they may not show answer keys if they don't have the `missing_word` field).

## Future Lessons
All newly generated lessons will automatically include the `missing_word` field and display the answer key properly.

## Date
December 30, 2025
