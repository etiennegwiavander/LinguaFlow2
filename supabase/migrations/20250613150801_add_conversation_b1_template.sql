-- Insert Conversation B1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'B1 Conversation Lesson',
  'Conversation',
  'b1',
  '{
    "name": "B1 Conversation Lesson",
    "category": "Conversation",
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
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview"
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
        "id": "useful_expressions",
        "type": "exercise",
        "title": "Useful Expressions",
        "instruction": "Learn and practice these helpful phrases for real-life situations.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
      },
      {
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Important words and phrases related to the topic, with definitions and example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "example_dialogue",
        "type": "exercise",
        "title": "Example Dialogue",
        "instruction": "Read or listen to the following dialogue to model natural language use.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_questions",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Answer these questions to check your understanding of the dialogue.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "discussion_questions_prompts",
        "type": "exercise",
        "title": "Discussion Questions/Prompts",
        "instruction": "Discuss your thoughts and experiences related to the topic.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Engage in these interactive activities to reinforce the lesson content.",
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
);
