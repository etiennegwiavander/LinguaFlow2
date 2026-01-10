# Grammar B1 Template Fix

## Problem
The Grammar B1 lesson template had structural issues causing sections to display as raw JSON instead of being properly rendered.

## Issues Found

### 1. Typo in Property Name (Section 7)
**Location:** Speaking Practice/Role-Play section
```json
// ❌ BEFORE (incorrect)
"instruction_bg_color_color_var": "secondary_bg"

// ✅ AFTER (correct)
"instruction_bg_color_var": "secondary_bg"
```

### 2. Unsupported Content Type: "vocabulary_matching" (Section 2)
**Location:** Key Vocabulary section
```json
// ❌ BEFORE (unsupported)
"content_type": "vocabulary_matching"

// ✅ AFTER (supported)
"content_type": "vocabulary_section"
```

### 3. Unsupported Content Type: "fill_in_the_blanks_dialogue" (Section 6)
**Location:** Guided Practice/Fill-in-the-Blank section
```json
// ❌ BEFORE (unsupported)
"content_type": "fill_in_the_blanks_dialogue"
"dialogue_elements": []

// ✅ AFTER (supported)
"content_type": "matching"
"matching_pairs": []
```

### 4. Wrong Content Type for Speaking Practice (Section 7)
**Location:** Speaking Practice/Role-Play section
```json
// ❌ BEFORE (wrong type)
"content_type": "list"
"items": []

// ✅ AFTER (correct type)
"content_type": "role_play"
"role_play_scenarios": []
```

## Supported Content Types

Based on `LessonMaterialDisplay.tsx`, the following content types are supported:

1. **vocabulary_section** - Displays vocabulary items with words, definitions, and examples
2. **full_dialogue** - Displays dialogue with speaker names and lines
3. **matching** - Interactive matching quiz with pairs
4. **role_play** - Role-play scenarios with character dialogues
5. **list** - Simple list of items
6. **text** - Plain text content (for info cards)

## How to Apply the Fix

### Option 1: Run the Script (Recommended)
```bash
node scripts/fix-grammar-b1-template.js
```

### Option 2: Apply the Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply the specific migration
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250613150755_add_grammar_b1_template_fixed.sql
```

## Verification

After applying the fix, verify that:
1. ✅ "Comprehension Questions" section displays as an interactive matching quiz
2. ✅ "Speaking Practice/Role-Play" section displays role-play scenarios properly
3. ✅ "Key Vocabulary" section displays vocabulary items correctly
4. ✅ "Guided Practice" section displays as a matching exercise
5. ✅ No sections show raw JSON

## Impact

This fix affects:
- All new Grammar B1 lessons generated after the fix
- Existing Grammar B1 lessons will continue to use the old structure until regenerated

## Related Files

- `supabase/migrations/20250613150755_add_grammar_b1_template_fixed.sql` - Corrected migration
- `scripts/fix-grammar-b1-template.js` - Script to apply the fix
- `components/lessons/LessonMaterialDisplay.tsx` - Component that renders lesson content
