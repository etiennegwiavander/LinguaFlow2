-- Add Pronunciation B1 template structure
-- Based on Engoo lesson format: Pronunciation - Minimal Pairs /h/ /r/
-- This template provides the structure for generating personalized B1 pronunciation lessons (suitable for intermediate level)

INSERT INTO lesson_templates (
  name,
  category,
  level,
  template_json,
  is_active
) VALUES (
  'Pronunciation B1',
  'Pronunciation',
  'b1',
  '{
    "lesson_structure": [
      {
        "id": "header",
        "type": "title",
        "title": "Pronunciation B1",
        "subtitle": "Challenging Sound Distinctions & Communication Clarity"
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
          "Master challenging sound distinctions and minimal pairs that affect meaning in communication",
          "Develop accurate articulation techniques for problematic consonant and vowel combinations",
          "Recognize and correct common pronunciation errors that interfere with clear communication",
          "Apply correct pronunciation patterns in connected speech and natural conversation contexts",
          "Build pronunciation awareness for self-correction and continuous improvement in speaking fluency"
        ]
      },
      {
        "id": "activities",
        "type": "activities",
        "activities": [
          "Intensive minimal pair discrimination practice with challenging sound combinations and meaning differences",
          "Articulation technique training using tongue twisters, rhythm exercises, and connected speech patterns",
          "Error analysis and correction activities focusing on common B1-level pronunciation mistakes",
          "Contextual pronunciation practice through dialogues, role-plays, and real communication scenarios",
          "Pronunciation pattern recognition in natural speech through listening analysis and shadowing exercises",
          "Self-monitoring and peer correction activities using recording analysis and feedback techniques"
        ]
      },
      {
        "id": "materials",
        "type": "materials",
        "materials": [
          "Comprehensive minimal pair word lists with B1 vocabulary and clear phonetic transcriptions",
          "Natural speed audio recordings with various accents and connected speech examples",
          "Articulation diagrams showing precise tongue, lip, and breath control for challenging sounds",
          "Interactive pronunciation tools including spectrograms and visual feedback for sound analysis",
          "Contextual practice materials with dialogues, conversations, and real-world communication scenarios",
          "Self-assessment recording equipment and pronunciation analysis software for independent practice"
        ]
      },
      {
        "id": "assessment",
        "type": "assessment",
        "assessment": [
          "Comprehensive minimal pair recognition test with meaning-based context and communication focus",
          "Articulation accuracy assessment through individual pronunciation evaluation and peer feedback",
          "Connected speech evaluation using natural conversation scenarios and communication effectiveness",
          "Self-recording analysis with pronunciation improvement tracking and goal-setting activities",
          "Peer assessment through pronunciation coaching exercises and collaborative improvement activities"
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
    "description": "B1-level pronunciation template following Engoo minimal pairs lesson structure. Focuses on challenging sound distinctions, intermediate pronunciation patterns, and communication clarity. AI will personalize content with B1 vocabulary and practical pronunciation challenges suitable for intermediate students."
  }'::jsonb,
  true
);

-- Add comment explaining the B1 pronunciation template structure
COMMENT ON COLUMN lesson_templates.template_json IS 'JSONB template structure - B1 pronunciation includes header, challenging objectives, intensive activities, comprehensive materials, advanced assessment, and wrap-up sections';

-- Verify the insertion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lesson_templates 
    WHERE name = 'Pronunciation B1' 
    AND level = 'b1' 
    AND category = 'Pronunciation'
    AND template_json IS NOT NULL 
    AND template_json ? 'lesson_structure'
  ) THEN
    RAISE NOTICE 'SUCCESS: Pronunciation B1 template created with complete structure including header and wrap-up sections';
  ELSE
    RAISE NOTICE 'WARNING: Pronunciation B1 template may not have been created properly';
  END IF;
END $$;