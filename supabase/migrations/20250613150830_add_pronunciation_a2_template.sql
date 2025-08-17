-- Add Pronunciation A2 template structure
-- Based on Engoo lesson format: Pronunciation - Basic Sound Contrasts
-- This template provides the structure for generating personalized A2 pronunciation lessons (simplified for elementary level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'A2 Pronunciation Lesson',
  'Pronunciation',
  'a2',
  '{
    "name": "A2 Pronunciation Lesson",
    "category": "Pronunciation",
    "level": "a2",
    "colors": {
      "primary_bg": "bg-blue-100",
      "secondary_bg": "bg-cyan-100",
      "text_color": "text-gray-900",
      "accent_color": "text-blue-600",
      "border_color": "border-gray-400"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Pronunciation Practice: [Sound 1] and [Sound 2]",
        "subtitle": "Building clear pronunciation of two basic contrasting sounds."
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
        "id": "pronunciation_tips_sound1",
        "type": "exercise",
        "title": "Simple Tips: Sound 1",
        "instruction": "Follow these easy steps to pronounce Sound 1.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "pronunciation_tips_sound1"
      },
      {
        "id": "pronunciation_tips_sound2",
        "type": "exercise",
        "title": "Simple Tips: Sound 2",
        "instruction": "Follow these easy steps to pronounce Sound 2.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "pronunciation_tips_sound2"
      },
      {
        "id": "key_vocabulary_sound1",
        "type": "exercise",
        "title": "Word List Practice: Sound 1",
        "instruction": "Practice saying these 6 to 8 common words with Sound 1.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "ai_placeholder": "word_list_sound1"
      },
      {
        "id": "key_vocabulary_sound2",
        "type": "exercise",
        "title": "Word List Practice: Sound 2",
        "instruction": "Practice saying these 6 to 8 common words with Sound 2.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "ai_placeholder": "word_list_sound2"
      },
      {
        "id": "example_sentences",
        "type": "exercise",
        "title": "Simple Sentence Practice",
        "instruction": "Read and repeat short, clear sentences featuring both sounds.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "example_sentences"
      },
      {
        "id": "example_paragraph",
        "type": "exercise",
        "title": "Short Paragraph Practice",
        "instruction": "Practice reading a simple paragraph using words with these sounds.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "example_paragraph"
      },
      {
        "id": "find_the_sounds",
        "type": "exercise",
        "title": "Sound Identification",
        "instruction": "Choose which words contain Sound 1 or Sound 2. There may be multiple answers.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "ai_placeholder": "find_the_sounds"
      },
      {
        "id": "discussion_questions_prompts",
        "type": "exercise",
        "title": "Talk About It",
        "instruction": "Discuss how these sounds feel to pronounce and easy ways to remember them.",
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

-- Add comment explaining the A2 pronunciation template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - A2 pronunciation includes header, simple pronunciation tips for each sound, word list practice, simple sentence practice, short paragraph practice, sound identification exercise, discussion prompts, and wrap-up sections';

-- Verify the insertion
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'A2 Pronunciation Lesson' 
    AND level = 'a2' 
    AND category = 'Pronunciation'
    AND template_json IS NOT NULL 
    AND template_json ? 'sections'
  ) THEN
    RAISE NOTICE 'SUCCESS: A2 Pronunciation Lesson template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: A2 Pronunciation Lesson template may not have been created properly';
  END IF;
END $;