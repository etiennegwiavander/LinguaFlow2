-- Add Pronunciation B2 template structure
-- Based on Engoo lesson format: Pronunciation - Minimal Pairs
-- This template provides the structure for generating personalized B2 pronunciation lessons (suitable for upper-intermediate level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'B2 Pronunciation Lesson',
  'Pronunciation',
  'b2',
  '{
    "name": "B2 Pronunciation Lesson",
    "category": "Pronunciation",
    "level": "b2",
    "colors": {
      "primary_bg": "bg-blue-100",
      "secondary_bg": "bg-indigo-100",
      "text_color": "text-gray-900",
      "accent_color": "text-blue-700",
      "border_color": "border-gray-400"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Pronunciation Practice: [Sound 1] and [Sound 2]",
        "subtitle": "Focus on minimal pairs and advanced pronunciation features."
      },
      {
        "id": "introduction_overview",
        "type": "info_card",
        "title": "Introduction/Overview",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "introduction_overview"
      },
      {
        "id": "pronunciation_tips",
        "type": "exercise",
        "title": "Pronunciation Tips",
        "instruction": "Learn and review important tips for pronouncing the target sounds clearly.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "pronunciation_tips"
      },
      {
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Vocabulary Practice - Minimal Pairs",
        "instruction": "Practice pronunciation by reading these words containing the target sounds.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "ai_placeholder": "key_vocabulary"
      },
      {
        "id": "example_sentences",
        "type": "exercise",
        "title": "Sentence Practice",
        "instruction": "Practice pronunciation with your tutor by reading the following sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "example_sentences"
      },
      {
        "id": "find_the_sounds",
        "type": "exercise",
        "title": "Find the Sounds",
        "instruction": "Identify the target sound in each sentence. Multiple answers may be correct.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "ai_placeholder": "find_the_sounds"
      },
      {
        "id": "tongue_twister",
        "type": "exercise",
        "title": "Tongue Twister Practice",
        "instruction": "Practice pronunciation by reading these tongue twisters slowly, then faster.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "tongue_twister"
      },
      {
        "id": "discussion_prompts",
        "type": "exercise",
        "title": "Discussion Prompts",
        "instruction": "Discuss challenges and strategies related to mastering these sounds.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "wrap_up_reflection",
        "type": "info_card",
        "title": "Wrap-up & Reflection",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "wrap_up_reflection"
      }
    ]
  }'::jsonb,
  true
);

-- Add comment explaining the B2 pronunciation template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - B2 pronunciation includes header, pronunciation tips, vocabulary practice with minimal pairs, sentence practice, find the sounds exercise, tongue twister practice, discussion prompts, and wrap-up sections';

-- Verify the insertion
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'B2 Pronunciation Lesson' 
    AND level = 'b2' 
    AND category = 'Pronunciation'
    AND template_json IS NOT NULL 
    AND template_json ? 'sections'
  ) THEN
    RAISE NOTICE 'SUCCESS: B2 Pronunciation Lesson template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: B2 Pronunciation Lesson template may not have been created properly';
  END IF;
END $;