# Vocabulary Example Generation - Root Cause & Fix

## 🚨 ROOT CAUSE IDENTIFIED

### The Problem
Vocabulary words are being generated **WITHOUT example sentences** and with **"undefined" values** for word names.

### The Root Cause
The Business English lesson templates contain **pre-defined vocabulary items with WRONG field names**:

**Template has:**
```json
{
  "name": "Networking",
  "prompt": "The action or process...",
  "image_url": "...",
  "examples": []
}
```

**Frontend expects:**
```json
{
  "word": "Networking",
  "definition": "The action or process...",
  "part_of_speech": "noun",
  "examples": ["sentence 1", "sentence 2", ...]
}
```

### Why This Happens
1. The AI receives the template with pre-defined vocabulary items
2. The AI copies the template structure instead of generating new content
3. The template uses `"name"` and `"prompt"` fields (wrong)
4. The frontend looks for `"word"` and `"definition"` fields (correct)
5. Result: `item.word` is `undefined` because the field is actually `item.name`
6. Result: `item.examples` is `[]` because the template has empty arrays

## 📊 Evidence

### Broken Lesson Analysis
- **Lesson ID**: `6d82e457-80e9-461a-ab8b-1d2a444587dc`
- **Created**: January 27, 2026, 8:01 AM
- **Template**: Business English Lesson (B2)
- **Template ID**: `aacbd4e2-879c-425a-a1ed-6881e0c26674`

### Actual Data in Database
```json
{
  "vocabulary_items": [
    {
      "name": "Invest",
      "prompt": "To commit money or capital...",
      "examples": [],
      "image_url": "..."
    },
    {
      "name": "Portfolio",
      "prompt": "A range of investments...",
      "examples": [],
      "image_url": "..."
    },
    {
      "name": "Asset",
      "prompt": "A resource with economic value...",
      "examples": [],
      "image_url": "..."
    }
  ]
}
```

### Frontend Display Result
```
Word: undefined (because code looks for item.word, but field is item.name)
Definition: undefined (because code looks for item.definition, but field is item.prompt)
Examples: (empty - because examples array is [])
```

## 🔍 Affected Templates

All Business English templates have this issue:
1. **Business English Networking Lesson** (B1) - ID: `08f66303-3751-4ad3-bca8-e1bf0d1640b8`
2. **Business English Lesson** (B2) - ID: `aacbd4e2-879c-425a-a1ed-6881e0c26674` ⚠️ CONFIRMED BROKEN
3. **Business English Interview Lesson** (C1) - ID: `f5165f76-8495-43a5-b2fb-88986a5181a2`
4. **Business English Lesson** (C1) - ID: `5dfc64f3-a4d2-4adf-b1bd-ffb4b540aedd`

## ✅ Solution

### Option 1: Fix the Templates (RECOMMENDED)
Update all Business English templates to use the correct field structure:

```sql
UPDATE lesson_templates
SET template_json = jsonb_set(
  template_json,
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN section->>'content_type' = 'vocabulary_matching' THEN
          jsonb_set(
            jsonb_set(
              section,
              '{vocabulary_items}',
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'word', item->>'name',
                    'definition', item->>'prompt',
                    'part_of_speech', 'noun',
                    'examples', '[]'::jsonb
                  )
                )
                FROM jsonb_array_elements(section->'vocabulary_items') AS item
              )
            ),
            '{ai_placeholder}',
            '"vocabulary_items"'::jsonb
          )
        ELSE section
      END
    )
    FROM jsonb_array_elements(template_json->'sections') AS section
  )
)
WHERE category = 'Business English';
```

### Option 2: Fix the AI Prompt (ALTERNATIVE)
Add explicit instructions to the AI to IGNORE the template's vocabulary structure and generate fresh content:

```typescript
⚠️ VOCABULARY GENERATION OVERRIDE:
If you see vocabulary_items in the template with "name" and "prompt" fields,
IGNORE THEM COMPLETELY. Generate NEW vocabulary items with this structure:
{
  "word": "actual_word",
  "definition": "clear definition",
  "part_of_speech": "noun/verb/adjective/etc",
  "examples": ["sentence 1", "sentence 2", "sentence 3", ...]
}
```

### Option 3: Fix the Frontend (TEMPORARY WORKAROUND)
Add field mapping in the frontend to handle both structures:

```typescript
const word = item.word || item.name;
const definition = item.definition || item.prompt;
const examples = item.examples || [];
```

## 🎯 Recommended Action Plan

1. **Immediate Fix**: Apply Option 3 (frontend workaround) to handle existing broken lessons
2. **Template Fix**: Apply Option 1 to fix all Business English templates
3. **AI Prompt Enhancement**: Apply Option 2 to prevent future issues
4. **Regenerate Broken Lessons**: Offer users to regenerate lessons created with broken templates

## 📝 Implementation Steps

### Step 1: Frontend Workaround (Immediate)
```typescript
// In LessonMaterialDisplay.tsx
const vocabularyItems = section.vocabulary_items?.map(item => ({
  word: item.word || item.name,
  definition: item.definition || item.prompt,
  part_of_speech: item.part_of_speech || 'noun',
  examples: item.examples || []
})) || [];
```

### Step 2: Fix Templates (Database Migration)
Create migration: `fix_business_english_vocabulary_structure.sql`

### Step 3: Enhance AI Prompt
Add vocabulary structure override instructions to Edge Function

### Step 4: Test
1. Generate new Business English lesson
2. Verify vocabulary has correct structure
3. Verify examples are generated
4. Verify frontend displays correctly

## 🔍 Verification Checklist

- [ ] Frontend displays vocabulary words (not "undefined")
- [ ] Frontend displays definitions (not "undefined")
- [ ] Frontend displays example sentences (not empty)
- [ ] New lessons use correct structure
- [ ] Old lessons are handled gracefully
- [ ] All Business English templates are fixed

## 📊 Impact Assessment

**Affected Lessons**: All Business English lessons generated with these templates
**Severity**: HIGH - Brand impact (empty vocabulary sections look unprofessional)
**User Impact**: Students see incomplete lessons
**Fix Complexity**: MEDIUM - Requires template updates and frontend changes

---

**Status**: 🔍 ROOT CAUSE IDENTIFIED
**Next Action**: Implement fixes in order (Frontend → Templates → AI Prompt)
