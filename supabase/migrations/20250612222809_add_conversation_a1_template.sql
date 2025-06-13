-- Update A1 Conversation Lesson Template to be more generic
UPDATE lesson_templates
SET template_json = '{
    "name": "A1 Conversation Lesson",
    "category": "Conversation",
    "level": "a1",
    "colors": {
      "primary_bg": "bg-blue-100",
      "secondary_bg": "bg-green-100",
      "text_color": "text-gray-800",
      "accent_color": "text-blue-600",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview"
      },
      {
        "id": "learning_objectives",
        "type": "info_card",
        "title": "Learning Objectives",
        "background_color_var": "primary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "objectives"
      },
      {
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Listen and repeat the new words and phrases.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [
          { "image_url": "", "name": "Word 1", "prompt": "Meaning of word 1" },
          { "image_url": "", "name": "Word 2", "prompt": "Meaning of word 2" }
        ],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "example_dialogue",
        "type": "exercise",
        "title": "Example Dialogue",
        "instruction": "Read or listen to this simple conversation.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_questions",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Answer these questions about the dialogue.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "discussion_questions_prompts",
        "type": "exercise",
        "title": "Discussion Questions",
        "instruction": "Talk about these questions with your tutor.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "useful_expressions",
        "type": "exercise",
        "title": "Useful Expressions",
        "instruction": "Practice saying these helpful phrases.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Let''s do some activities to practice what you learned.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "practice_activities"
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
  }'::jsonb
WHERE name = 'A1 Conversation Lesson' AND category = 'Conversation' AND level = 'a1';
