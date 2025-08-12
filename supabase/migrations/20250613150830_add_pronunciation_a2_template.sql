-- Add Pronunciation A2 template structure
-- Based on Engoo lesson format: Pronunciation - Vowels /ʌ/ /ɑ/
-- This template provides the structure for generating personalized A2 pronunciation lessons (simplified for elementary level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'Pronunciation A2',
  'Pronunciation',
  'a2',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "Pronunciation A2",
        "subtitle": "Basic Sound Recognition & Clear Speech Development"
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
        "id": "objectives",
        "type": "objectives",
        "objectives": [
          "Recognize and identify basic vowel sounds in simple, common words",
          "Practice correct mouth position and tongue placement for target sounds",
          "Distinguish between similar sounds using easy vocabulary and clear examples",
          "Build confidence in pronouncing common A2-level words correctly",
          "Apply correct pronunciation in simple sentences and basic conversations"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "Sound recognition exercise with simple word pairs and clear audio examples",
          "Mouth position practice using mirrors and simple visual guides for tongue and lip placement",
          "Easy listening and repeat activities with common A2 vocabulary and slow, clear pronunciation",
          "Simple minimal pair practice with basic words that A2 students know well",
          "Basic sentence practice using target sounds in simple, everyday expressions",
          "Easy pronunciation games and activities with familiar vocabulary and clear sound patterns"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Simple pronunciation charts with clear pictures showing mouth positions and tongue placement",
          "Slow, clear audio recordings with A2-level vocabulary focusing on target sounds",
          "Basic mirrors for students to see their mouth position during pronunciation practice",
          "Easy word cards with simple vocabulary containing target sounds and clear phonetic symbols",
          "Simple visual guides showing step-by-step mouth movements for correct sound production",
          "Basic recording tools for students to practice and compare their pronunciation with examples"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Simple sound recognition test using familiar A2 vocabulary and clear audio",
          "Basic pronunciation check through individual practice with common words and simple sentences",
          "Easy listening discrimination test with simple word pairs and slow, clear speech",
          "Simple recording assessment where students pronounce basic words and short phrases",
          "Basic peer practice evaluation using simple pronunciation exercises and familiar vocabulary"
        ]
      },
      {
        "id": "wrap_up_reflection",
        "type": "info_card",
        "title": "Wrap-up & Reflection",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "wrap_up_reflection"
      }
    ],
    "description": "A2-level pronunciation template following Engoo vowel sound lesson structure. Focuses on basic sound recognition, simple pronunciation practice, and clear speech development. AI will personalize content with common A2 vocabulary and simple sound patterns suitable for elementary students."
  }'::jsonb,
  true
);

-- Add comment explaining the A2 pronunciation template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - A2 pronunciation includes header, basic sound objectives, simple activities, clear materials, easy assessment, and wrap-up sections';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'Pronunciation A2' 
    AND level = 'a2' 
    AND category = 'Pronunciation'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: Pronunciation A2 template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: Pronunciation A2 template may not have been created properly';
  END IF;
END $$;