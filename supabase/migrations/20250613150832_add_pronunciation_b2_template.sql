-- Add Pronunciation B2 template structure
-- Based on Engoo lesson format: Pronunciation - Minimal Pairs /p/ /b/
-- This template provides the structure for generating personalized B2 pronunciation lessons (suitable for upper-intermediate level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'Pronunciation B2',
  'Pronunciation',
  'b2',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "Pronunciation B2",
        "subtitle": "Advanced Articulation Refinement & Professional Accuracy"
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
          "Achieve precise articulation of subtle phonetic distinctions that impact professional and academic communication",
          "Master advanced voicing contrasts and aspiration patterns in complex phonetic environments",
          "Develop sophisticated phonetic awareness for accent reduction and pronunciation refinement",
          "Apply advanced pronunciation skills in formal presentations, debates, and professional interactions",
          "Demonstrate near-native pronunciation accuracy in spontaneous speech and complex linguistic contexts"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "Advanced minimal pair analysis with subtle phonetic distinctions and complex voicing patterns",
          "Sophisticated articulation refinement using advanced phonetic techniques and precision training",
          "Professional communication practice integrating pronunciation accuracy with complex content delivery",
          "Advanced phonetic transcription and analysis activities for deep pronunciation understanding",
          "Accent modification exercises focusing on specific regional variations and professional speech patterns",
          "Spontaneous speech evaluation with real-time pronunciation feedback and advanced correction techniques"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Advanced phonetic analysis tools including detailed spectrograms and acoustic measurement software",
          "Professional-quality audio recordings featuring various English accents and formal speech contexts",
          "Sophisticated pronunciation reference materials with detailed phonetic descriptions and articulatory guides",
          "Advanced recording and analysis equipment for precise pronunciation measurement and feedback",
          "Professional communication scenarios including presentations, interviews, and academic discussions",
          "Comprehensive phonetic training resources with advanced exercises and accent modification techniques"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Comprehensive phonetic accuracy assessment using advanced acoustic analysis and professional evaluation criteria",
          "Professional communication evaluation through formal presentations and complex speaking tasks",
          "Advanced pronunciation portfolio including self-analysis, peer feedback, and expert assessment",
          "Spontaneous speech assessment with focus on pronunciation maintenance under cognitive load",
          "Accent consistency evaluation across various communication contexts and professional scenarios"
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
    "description": "B2-level pronunciation template following Engoo minimal pairs lesson structure. Focuses on subtle sound distinctions, advanced articulation refinement, and near-native pronunciation accuracy. AI will personalize content with sophisticated phonetic challenges and professional communication contexts suitable for upper-intermediate students."
  }'::jsonb,
  true
);

-- Add comment explaining the B2 pronunciation template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - B2 pronunciation includes header, advanced objectives, sophisticated activities, professional materials, expert assessment, and wrap-up sections';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'Pronunciation B2' 
    AND level = 'b2' 
    AND category = 'Pronunciation'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: Pronunciation B2 template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: Pronunciation B2 template may not have been created properly';
  END IF;
END $$;