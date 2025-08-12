-- Add English for Travel A2 template structure
-- Based on Engoo lesson format: Travel Culture - Travel Emergencies: Asking for Help
-- This template provides the structure for generating personalized A2 travel lessons (simplified for elementary level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'English for Travel A2',
  'Travel English',
  'a2',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "English for Travel A2",
        "subtitle": "Basic Travel Communication & Emergency Help"
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
          "Learn basic travel vocabulary for common situations and simple emergencies",
          "Practice asking for help using simple, clear phrases and polite expressions",
          "Understand and use basic directions and location words for travel situations",
          "Build confidence in simple conversations with hotel staff, taxi drivers, and helpful locals",
          "Recognize and respond to basic travel problems with appropriate simple language"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "Simple vocabulary matching with basic travel words and emergency phrases",
          "Easy role-play practice (asking for directions, simple hotel problems, basic help requests)",
          "Short reading exercises with simple travel emergency stories and helpful phrases",
          "Basic listening practice with clear, slow speech about travel help situations",
          "Simple conversation practice sharing easy travel experiences and asking basic questions",
          "Easy writing task creating simple travel phrases or a basic travel emergency plan"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Basic travel vocabulary cards with simple words and clear pictures",
          "Slow, clear audio recordings with basic travel help conversations",
          "Simple maps and basic direction signs for easy practice",
          "Easy-to-read emergency phrase cards with common travel problems",
          "Basic cultural tip sheets with simple dos and donts for travelers",
          "Simple emergency contact cards and basic help-seeking phrases"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Simple vocabulary test with basic travel words and emergency phrases",
          "Easy speaking practice through simple role-play situations",
          "Basic writing check using simple sentences about travel help",
          "Clear listening test with slow speech about travel emergency situations",
          "Simple presentation sharing basic travel tips using easy vocabulary"
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
    "description": "A2-level travel English template following Engoo emergency help lesson structure. Focuses on basic travel communication, simple emergency situations, and essential help-seeking skills. AI will personalize content with simple vocabulary and clear, practical scenarios suitable for elementary students."
  }'::jsonb,
  true
);

-- Add comment explaining the A2 template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - A2 level includes header, basic objectives, simple activities, clear materials, easy assessment, and wrap-up sections';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'English for Travel A2' 
    AND level = 'a2' 
    AND category = 'Travel English'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: English for Travel A2 template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: English for Travel A2 template may not have been created properly';
  END IF;
END $$;