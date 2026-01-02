-- Insert English for Kids A1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'English for Kids Lesson',
  'English for Kids',
  'a1',
  '{
    "name": "English for Kids Lesson",
    "category": "English for Kids",
    "level": "a1",
    "colors": {
      "primary_bg": "bg-blue-50",
      "secondary_bg": "bg-pink-50",
      "text_color": "text-gray-800",
      "accent_color": "text-blue-600",
      "border_color": "border-gray-200"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/3865556/pexels-photo-3865556.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      },
      {
        "id": "introduction_overview",
        "type": "info_card",
        "title": "Introduction",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "introduction_overview"
      },
      {
        "id": "warm_up",
        "type": "exercise",
        "title": "Warm-up",
        "instruction": "Match the words with their translations in your native language.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_translation_match",
        "items": [],
        "ai_placeholder": "warmup_content"
      },
      {
        "id": "target_vocabulary_expressions",
        "type": "exercise",
        "title": "Target Vocabulary",
        "instruction": "Key words and phrases with simple example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_expressions"
      },
      {
        "id": "example_dialogue",
        "type": "exercise",
        "title": "Example Dialogue",
        "instruction": "A short, simple conversation between two characters.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "practice_comprehension_activities",
        "type": "exercise",
        "title": "Practice/Comprehension Activities",
        "instruction": "Simple questions or matching exercises.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "practice_comprehension_activities"
      },
      {
        "id": "speaking_practice",
        "type": "exercise",
        "title": "Speaking Practice",
        "instruction": "Prompts for students to practice introducing themselves.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "speaking_practice_prompts"
      },
      {
        "id": "song_or_chant",
        "type": "exercise",
        "title": "Song or Chant",
        "instruction": "Lyrics or instructions for a simple song/chant.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "song_chant"
      },
      {
        "id": "fun_activity_game",
        "type": "exercise",
        "title": "Fun Activity/Game",
        "instruction": "Interactive game or drawing activity.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "fun_activity_game"
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
