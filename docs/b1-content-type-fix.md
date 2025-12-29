# B1 Content Type Fix - English for Kids

## Problem

The English for Kids B1 template contains 6 content types that are not implemented in `LessonMaterialDisplay.tsx`:

1. `drawing_tool_match` - Warm-up section
2. `listen_repeat` - Listen and Repeat section
3. `audio_picture_choice` - Which Picture? section
4. `say_what_you_see` - Say What You See section
5. `complete_sentence` - Complete the Sentence section
6. `answer_questions` - Answer the Questions section

Additionally, the `Learning Objectives` section uses `content_type: "list"` but is an `info_card` type, which means it needs special handling.

## Root Cause

When the B1 template was created, these specialized content types were defined but the rendering logic was never implemented in the `LessonMaterialDisplay.tsx` component. The component's `renderExerciseContent` function has a switch statement that only handles:

- `list`
- `text`
- `grammar_explanation`
- `example_sentences`
- `vocabulary_matching` / `vocabulary`
- `full_dialogue`
- `matching`
- `fill_in_the_blanks_dialogue`

Any unrecognized content type falls through to the default case which displays:
```
"Content type "{contentType}" will be displayed here."
```

## Solution Options

### Option 1: Quick Fix - Map to Existing Types (RECOMMENDED)

Map the unsupported content types to the existing `list` type in the switch statement. This allows the AI-generated content to display immediately without custom UI implementation.

**Implementation**: Add fallthrough cases in the switch statement:

```typescript
case 'drawing_tool_match':
case 'listen_repeat':
case 'audio_picture_choice':
case 'say_what_you_see':
case 'complete_sentence':
case 'answer_questions':
case 'list': {
  // Existing list rendering logic
  ...
}
```

**Pros**:
- Immediate fix
- No new UI components needed
- AI-generated content displays correctly
- Maintains consistency with existing patterns

**Cons**:
- Generic list display (no specialized UI for each activity type)
- Doesn't leverage the unique nature of each content type

### Option 2: Implement Custom Rendering (FUTURE ENHANCEMENT)

Create specialized rendering for each content type with interactive features:

1. **drawing_tool_match**: Interactive matching interface with drag-and-drop
2. **listen_repeat**: Audio playback with pronunciation feedback
3. **audio_picture_choice**: Picture selection with audio cues
4. **say_what_you_see**: Image display with speech recording
5. **complete_sentence**: Fill-in-the-blank with word bank
6. **answer_questions**: Question-answer interface with validation

**Pros**:
- Rich, interactive learning experience
- Specialized UI for each activity type
- Better pedagogical value

**Cons**:
- Significant development time
- Requires audio/image assets
- More complex state management
- Needs testing across devices

## Recommended Action

**Implement Option 1 immediately** to fix the current issue and allow B1 lessons to display properly.

**Plan Option 2 as a future enhancement** when resources allow for building interactive learning components.

## Implementation Steps

1. ✅ Diagnose the issue (completed)
2. ⏳ Update `LessonMaterialDisplay.tsx` to add fallthrough cases
3. ⏳ Test B1 lesson generation and display
4. ⏳ Update AI prompt to generate appropriate content for these types
5. ⏳ Document the fix

## AI Prompt Considerations

The AI prompt in `generate-interactive-material/index.ts` should instruct the AI to generate simple list items for these content types:

- **drawing_tool_match**: List of words/phrases to match
- **listen_repeat**: List of sentences to practice
- **audio_picture_choice**: List of picture descriptions
- **say_what_you_see**: List of prompts/scenarios
- **complete_sentence**: List of sentence completion exercises
- **answer_questions**: List of questions with expected answers

## Testing Checklist

After implementing the fix:

- [ ] Generate a new B1 English for Kids lesson
- [ ] Verify all sections display content (no "Content type X will be displayed here" messages)
- [ ] Check that AI-generated content appears in each section
- [ ] Verify the Learning Objectives section displays as a list
- [ ] Test on mobile and desktop
- [ ] Verify double-click translation works on all content
- [ ] Check that lesson export (PDF/Word) includes all sections

## Related Files

- `components/lessons/LessonMaterialDisplay.tsx` - Main rendering component
- `supabase/functions/generate-interactive-material/index.ts` - AI prompt and generation
- `supabase/migrations/20250613150807_add_english_for_kids_b1_template.sql` - B1 template definition
- `scripts/diagnose-b1-content-types.js` - Diagnostic script

---

**Status**: Issue Identified ✅  
**Fix**: Pending Implementation ⏳  
**Priority**: High (blocks B1 lesson usage)  
**Estimated Time**: 30 minutes  

**Last Updated**: December 29, 2025
