-- Add English for Travel C1 template structure
-- Based on Engoo lesson format: Travel Culture - See the World: Top 5 Places to Visit in New Zealand
-- This template provides the structure for generating personalized C1 travel lessons

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'English for Travel C1',
  'Travel English',
  'c1',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "English for Travel C1",
        "subtitle": "Expert Travel Discourse & Cultural Analysis"
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
          "Demonstrate mastery of sophisticated travel vocabulary and destination-specific terminology",
          "Analyze and evaluate travel destinations using complex criteria and cultural insights",
          "Articulate nuanced opinions and recommendations with supporting evidence and cultural context",
          "Engage in expert-level discussions about tourism impact, sustainability, and cultural preservation",
          "Produce comprehensive travel content with advanced linguistic structures and cultural sensitivity"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "In-depth destination analysis with sophisticated vocabulary and cultural terminology",
          "Expert-level role-play scenarios (travel consulting, destination marketing, cultural interpretation)",
          "Critical reading and analysis of travel literature, reviews, and cultural commentary",
          "Advanced listening comprehension with expert travel discussions and documentary content",
          "Sophisticated debate and presentation on tourism ethics, sustainability, and cultural impact",
          "Professional writing tasks including travel journalism, destination guides, and cultural analysis"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Advanced travel and cultural vocabulary with idiomatic expressions and specialized terminology",
          "Professional-level audio content including travel documentaries, expert interviews, and cultural discussions",
          "Comprehensive destination resources including cultural studies, historical context, and tourism data",
          "Authentic professional materials such as travel industry reports, marketing content, and cultural guides",
          "Advanced cultural analysis frameworks and tourism impact assessment tools",
          "Professional communication templates for travel industry contexts and cultural commentary"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Comprehensive vocabulary and cultural terminology assessment with sophisticated usage evaluation",
          "Expert-level oral assessment through professional travel scenarios and cultural analysis presentations",
          "Advanced written evaluation including travel journalism, cultural commentary, or industry analysis",
          "Professional listening comprehension with travel industry content and cultural documentaries",
          "Portfolio assessment of travel content creation and cultural analysis with peer and expert review"
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
    "description": "C1-level travel English template following Engoo destination exploration lesson structure. Focuses on sophisticated travel discourse, destination analysis, and expert-level cultural commentary. AI will personalize content based on student travel expertise and analytical interests."
  }'::jsonb,
  true
);

-- Add comment explaining the C1 template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - C1 level includes header, expert objectives, advanced activities, professional materials, sophisticated assessment, and wrap-up sections';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'English for Travel C1' 
    AND level = 'c1' 
    AND category = 'Travel English'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: English for Travel C1 template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: English for Travel C1 template may not have been created properly';
  END IF;
END $$;