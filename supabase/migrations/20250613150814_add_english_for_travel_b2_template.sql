-- Add English for Travel B2 template structure
-- Based on Engoo lesson format: Travel Culture - Transportation: Getting a Taxi
-- This template provides the structure for generating personalized B2 travel lessons

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'English for Travel B2',
  'Travel English',
  'b2',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "English for Travel B2",
        "subtitle": "Advanced Travel Communication & Transportation Systems"
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
          "Master advanced transportation vocabulary and complex booking procedures",
          "Navigate sophisticated travel scenarios with confidence and cultural awareness",
          "Understand and use formal and informal register in travel contexts",
          "Develop problem-solving communication skills for travel complications",
          "Express preferences, complaints, and detailed travel requirements effectively"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "Advanced vocabulary analysis with transportation terminology and cultural nuances",
          "Complex role-play scenarios (taxi negotiations, transportation complaints, alternative arrangements)",
          "Detailed reading comprehension with transportation systems and cultural practices",
          "Multi-accent listening exercises featuring transportation dialogues and announcements",
          "Structured debate and discussion on transportation preferences and experiences",
          "Comprehensive writing task creating detailed travel guides or complaint letters"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Advanced transportation vocabulary with regional variations and formal/informal registers",
          "Multi-regional audio content featuring transportation scenarios and cultural contexts",
          "Detailed transportation maps, schedules, and booking systems for practice",
          "Authentic transportation documents, receipts, and complaint forms",
          "Cultural comparison materials highlighting transportation etiquette across regions",
          "Advanced phrase guides for complex transportation situations and negotiations"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Comprehensive vocabulary and register assessment with contextual usage",
          "Advanced oral evaluation through complex transportation scenarios and negotiations",
          "Detailed written assessment (travel guides, formal complaints, or recommendation letters)",
          "Multi-accent listening comprehension with transportation announcements and dialogues",
          "Presentation assessment on transportation systems comparison and cultural analysis"
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
    "description": "B2-level travel English template following Engoo transportation lesson structure. Focuses on advanced travel communication, transportation systems, and complex travel scenarios. AI will personalize content based on student travel experience and destination preferences."
  }'::jsonb,
  true
);

-- Add comment explaining the B2 template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - B2 level includes header, objectives, activities, materials, assessment, and wrap-up sections';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'English for Travel B2' 
    AND level = 'b2' 
    AND category = 'Travel English'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: English for Travel B2 template created/updated with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: English for Travel B2 template may not have been created properly';
  END IF;
END $$;