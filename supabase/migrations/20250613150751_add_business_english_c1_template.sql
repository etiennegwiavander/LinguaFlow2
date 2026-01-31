-- Insert Business English C1 Interview Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Business English Interview Lesson',
  'Business English',
  'c1',
  '{
    "name": "Business English Interview Lesson",
    "category": "Business English",
    "level": "c1",
    "colors": {
      "primary_bg": "bg-blue-100",
      "secondary_bg": "bg-teal-100",
      "text_color": "text-gray-800",
      "accent_color": "text-blue-600",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "instruction": "Practical business phrases or sentence starters for interviews.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
      },
      {
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Essential words and phrases with definitions and example sentences, focused on interview language.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "example_dialogue_reading",
        "type": "exercise",
        "title": "Example Dialogue or Reading",
        "instruction": "A realistic business dialogue or reading passage, such as a sample interview exchange or a narrative about a successful interview.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_questions",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Answer these questions to check understanding of the dialogue.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "role_play",
        "type": "exercise",
        "title": "Role-Play Scenarios",
        "instruction": "Practice real-life interview situations.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "role_play_scenarios"
      },
      {
        "id": "discussion_questions_prompts",
        "type": "exercise",
        "title": "Discussion Questions",
        "instruction": "Share your own interview experiences or strategies.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Activities such as role-plays, fill-in-the-blank exercises, or matching phrases to situations.",
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
