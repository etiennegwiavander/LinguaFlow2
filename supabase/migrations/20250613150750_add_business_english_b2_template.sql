-- Insert Business English B2 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Business English Lesson',
  'Business English',
  'b2',
  '{
    "name": "Business English Lesson",
    "category": "Business English",
    "level": "b2",
    "colors": {
      "primary_bg": "bg-purple-100",
      "secondary_bg": "bg-orange-100",
      "text_color": "text-gray-800",
      "accent_color": "text-purple-600",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Essential business and networking terms, with definitions and example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [
          { "image_url": "https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Networking", "prompt": "The action or process of interacting with others to exchange information and develop professional or social contacts." },
          { "image_url": "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Business Card", "prompt": "A small card printed with one name, professional occupation, company, and contact information." },
          { "image_url": "https://images.pexels.com/photos/356043/pexels-photo-356043.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Global Network", "prompt": "A worldwide system of interconnected business or professional contacts." }
        ],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "example_dialogue_reading",
        "type": "exercise",
        "title": "Example Dialogue or Reading",
        "instruction": "A realistic business dialogue or reading passage about networking situations.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_questions",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Answer these questions to check understanding.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "discussion_questions_prompts",
        "type": "exercise",
        "title": "Discussion Questions",
        "instruction": "Discuss your own networking experiences or strategies.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "useful_expressions",
        "type": "exercise",
        "title": "Useful Expressions",
        "instruction": "Practical business phrases or sentence starters for networking.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
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
