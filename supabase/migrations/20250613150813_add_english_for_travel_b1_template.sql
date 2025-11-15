-- Add English for Travel B1 template structure
-- Based on Engoo lesson format: Travel Culture & Slang Around the World
-- This template provides the structure for generating personalized travel lessons

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'English for Travel Lesson',
  'English for Travel',
  'b1',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "English for Travel B1",
        "subtitle": "Practical Travel Communication & Cultural Awareness"
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
          "Master essential travel vocabulary and booking expressions",
          "Understand cultural context and local expressions for target destination",
          "Practice navigation and location-based communication skills",
          "Develop confidence in traveler-local interactions",
          "Build emergency and problem-solving communication abilities"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "Vocabulary matching with destination-specific terms and expressions",
          "Interactive role-play scenarios (accommodation, directions, dining)",
          "Cultural reading comprehension with destination focus",
          "Authentic accent listening practice from target region",
          "Personal travel experience discussion and sharing",
          "Practical writing task using lesson vocabulary in context"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Destination-specific vocabulary flashcards and phrase guides",
          "Native speaker audio recordings from target region",
          "Regional maps and navigation materials for practice",
          "Authentic booking forms and transportation resources",
          "Cultural etiquette and customs information sheets",
          "Emergency communication phrase cards and scenarios"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Comprehensive vocabulary and expression assessment",
          "Practical oral evaluation through travel role-play",
          "Written communication task (travel planning/blogging)",
          "Regional accent listening comprehension test",
          "Peer evaluation of travel presentations and plans"
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
    "description": "B1-level travel English template following Engoo lesson structure. Focuses on practical travel communication, cultural awareness, and real-world scenarios. AI will personalize content based on student travel goals and target destinations."
  }'::jsonb,
  true
);

-- Add comment explaining the template
COMMENT ON TABLE lesson_templates IS 'Lesson templates for structured language learning with JSONB content fields';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'English for Travel B1' 
    AND level = 'b1' 
    AND category = 'Travel English'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: English for Travel B1 template created/updated with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: English for Travel B1 template may not have been created properly';
  END IF;
END $$;