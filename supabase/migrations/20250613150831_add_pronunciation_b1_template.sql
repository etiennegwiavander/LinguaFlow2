-- Add Pronunciation B1 template structure
-- Based on Engoo lesson format: Pronunciation - Minimal Pairs
-- This template provides the structure for generating personalized B1 pronunciation lessons (suitable for intermediate level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'B1 Pronunciation Lesson',
  'Pronunciation',
  'b1',
  '{
    "name": "B1 Pronunciation Lesson",
    "category": "Pronunciation",
    "level": "b1",
    "colors": {
      "primary_bg": "bg-teal-100",
      "secondary_bg": "bg-lime-100",
      "text_color": "text-gray-800",
      "accent_color": "text-teal-600",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Pronunciation Practice: [Sound 1] and [Sound 2]",
        "subtitle": "Focus on practicing and distinguishing two contrasting sounds."
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
        "id": "pronunciation_tips_sound2",
        "type": "exercise",
        "title": "Pronunciation Tips: Sound 2",
        "instruction": "Review tips for producing Sound 2.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "pronunciation_tips_sound2"
      },
      {
        "id": "key_vocabulary_sound1",
        "type": "exercise",
        "title": "Word List Practice: Sound 1",
        "instruction": "Practice saying these at least 10 words containing Sound 1.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "ai_placeholder": "word_list_sound1"
      },
      {
        "id": "key_vocabulary_sound2",
        "type": "exercise",
        "title": "Word List Practice: Sound 2",
        "instruction": "Practice saying these at least 10 words containing Sound 2.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "ai_placeholder": "word_list_sound2"
      },
      {
        "id": "example_sentences",
        "type": "exercise",
        "title": "Sentence Practice",
        "instruction": "Practice pronunciation with your tutor by reading sentences featuring both sounds.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "ai_placeholder": "example_sentences"
      },
      {
        "id": "example_paragraph",
        "type": "exercise",
        "title": "Paragraph Practice",
        "instruction": "Practice by reading the following paragraph aloud, containing words with both sounds.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "example_paragraph"
      },
      {
        "id": "find_the_sounds",
        "type": "exercise",
        "title": "Find the Sounds",
        "instruction": "Choose words which contain Sound 1 or Sound 2. Multiple answers may be correct.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "ai_placeholder": "find_the_sounds"
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

-- Add comment explaining the B1 pronunciation template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - B1 pronunciation includes header, pronunciation tips, word lists, sentence practice, paragraph practice, find the sounds exercise, discussion prompts, and wrap-up sections';

-- Verify the insertion
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'B1 Pronunciation Lesson' 
    AND level = 'b1' 
    AND category = 'Pronunciation'
    AND template_json IS NOT NULL 
    AND template_json ? 'sections'
  ) THEN
    RAISE NOTICE 'SUCCESS: B1 Pronunciation Lesson template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: B1 Pronunciation Lesson template may not have been created properly';
  END IF;
END $;