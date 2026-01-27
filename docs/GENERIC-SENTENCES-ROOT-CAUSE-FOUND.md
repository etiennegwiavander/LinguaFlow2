# Generic Sentences Root Cause - FOUND!

## 🎯 The Problem

User generated a lesson for student "test" with subtopic "Simuler une conversation dans un café" and got generic fallback sentences:

1. "The word 'serviette' is used in the context of language learning."
2. "Understanding 'serviette' helps with communication skills."
3. "Students practice using 'serviette' in relevant situations."

## 🔍 Root Cause Analysis

### The Issue is NOT the `generateContextualExamples()` function

That function (lines 778-863) is **never called**. The generic sentences are coming from a different source.

### The REAL Issue: Basic Fallback Prompt

When `selectAppropriateTemplate()` returns `null` (no matching template found), the code uses the **BASIC FALLBACK PROMPT** (lines 500-750).

This prompt contains EXAMPLE STRUCTURE that shows:

```typescript
"vocabulary": [
  {
    "word": "word1", 
    "definition": "definition1",
    "part_of_speech": "noun",
    "examples": [
      "Contextual sentence 1 using word1 in the context of ${subTopic.title}",
      "Contextual sentence 2 using word1 in the context of ${subTopic.title}",
      "Contextual sentence 3 using word1 in the context of ${subTopic.title}"
    ]
  }
]
```

**The AI is LITERALLY COPYING this example structure** and replacing "word1" with the actual vocabulary word, resulting in:

- "Contextual sentence 1 using **serviette** in the context of **Simuler une conversation dans un café**"

Which becomes the generic sentences you see!

## 🎯 Why This Happens

### Step 1: Template Selection Fails
```typescript
function selectAppropriateTemplate(subTopic, templates) {
  // Tries to match by category + level
  // Tries to match by category only
  // Tries to match by level only
  // Returns NULL if no match found
  return null;  // ❌ NO TEMPLATE FOUND
}
```

### Step 2: Fallback Prompt is Used
```typescript
if (template) {
  // Use template-based prompt ✅
  return constructInteractiveMaterialPrompt(student, subTopic, template);
} else {
  // Use basic fallback prompt ❌
  return `You are an expert language tutor creating basic interactive lesson content...
  
  Create a basic interactive lesson focused on this sub-topic. Respond with this JSON structure:
  
  {
    "vocabulary": [
      {
        "word": "word1",
        "examples": [
          "Contextual sentence 1 using word1 in the context of ${subTopic.title}",
          ...
        ]
      }
    ]
  }`;
}
```

### Step 3: AI Copies the Example Structure
The AI sees the example structure and thinks:
- "Oh, I should create sentences like this!"
- Replaces "word1" with actual word
- Keeps the generic structure: "Contextual sentence X using [word] in the context of [topic]"

## 📊 Evidence

Looking at the screenshots:
- Word: "serviette"
- Examples:
  1. "The word 'serviette' is used in the context of language learning."
  2. "Understanding 'serviette' helps with communication skills."
  3. "Students practice using 'serviette' in relevant situations."

These match the FALLBACK PROMPT pattern, NOT the template prompt pattern.

## 🔍 Why Template Selection Failed

For the café lesson:
- **Sub-topic**: "Simuler une conversation dans un café"
- **Category**: Conversation (most likely)
- **Level**: A1 (student "test" is A1 level)

The template selection should have found:
- **A1 Conversation Lesson** template

But it returned `null`, meaning:
1. No A1 Conversation template exists in database, OR
2. The subtopic category doesn't match "Conversation", OR
3. The subtopic level doesn't match "a1"

## ✅ The Solution

### Option 1: Fix the Fallback Prompt (Quick Fix)

Remove the generic example structure from the fallback prompt and replace with clear instructions:

```typescript
"examples": [
  // DO NOT use generic patterns like:
  // - "The word X is used in..."
  // - "Understanding X helps with..."
  // - "Students practice using X..."
  //
  // Instead, create REAL contextual sentences:
  // - "Je voudrais une serviette, s'il vous plaît."
  // - "La serviette est sur la table."
  // - "Pouvez-vous me donner une serviette?"
]
```

### Option 2: Ensure Template Always Matches (Better Fix)

Modify `selectAppropriateTemplate()` to NEVER return null:

```typescript
function selectAppropriateTemplate(subTopic, templates) {
  // Try exact match
  // Try category match
  // Try level match
  
  // FALLBACK: Return ANY template rather than null
  if (templates.length > 0) {
    console.warn(`⚠️ No matching template found, using first available template`);
    return templates[0];
  }
  
  return null;  // Only if NO templates exist at all
}
```

### Option 3: Remove Fallback Prompt Entirely (Best Fix)

The fallback prompt should NEVER be used. If no template matches, throw an error:

```typescript
const selectedTemplate = selectAppropriateTemplate(selected_sub_topic, templates);

if (!selectedTemplate) {
  throw new Error(
    `No matching template found for "${selected_sub_topic.category}" (Level: ${selected_sub_topic.level}). ` +
    `Please ensure the lesson template exists in the database.`
  );
}

// Always use template-based prompt
const prompt = constructInteractiveMaterialPrompt(student, selected_sub_topic, selectedTemplate);
```

## 🎯 Immediate Action Required

1. **Check the database** for A1 Conversation templates
2. **Verify the subtopic** has correct category and level fields
3. **Deploy the fix** to ensure template always matches or errors gracefully
4. **Remove or fix** the fallback prompt to prevent generic sentences

## 📝 Verification Steps

After deploying the fix:

1. Generate a new lesson for student "test"
2. Use subtopic "Simuler une conversation dans un café"
3. Check vocabulary examples
4. Confirm NO generic sentences appear
5. All examples should be contextually relevant French sentences

---

## 🚨 Critical Finding

**The fallback prompt is being used when it shouldn't be!**

The template-based prompt has all the fixes we implemented:
- ✅ Correct example counts
- ✅ No fallback generation
- ✅ Contextually relevant examples

But the BASIC FALLBACK PROMPT has:
- ❌ Generic example structure
- ❌ AI copies the pattern literally
- ❌ Results in generic sentences

**Solution**: Ensure the template-based prompt is ALWAYS used, never the fallback.
