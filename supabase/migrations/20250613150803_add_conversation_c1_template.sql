-- Insert Conversation C1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'C1 Conversation Lesson',
  'Conversation',
  'c1',
  '{
    "name": "C1 Conversation Lesson",
    "category": "Conversation",
    "level": "c1",
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
        "instruction": "Important words and phrases related to the topic.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "dialogue_example_speech",
        "type": "exercise",
        "title": "Dialogue or Example Speech",
        "instruction": "Read and practice the following conversation or speech.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_questions",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Answer the following questions to check your understanding.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "discussion_prompts",
        "type": "exercise",
        "title": "Discussion Prompts",
        "instruction": "Discuss your thoughts on the topic using these prompts.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Engage in these activities to reinforce your learning.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "practice_activities"
      }
    ]
  }'::jsonb
);
