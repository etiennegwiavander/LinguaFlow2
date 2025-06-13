-- Insert English for Kids B2 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'English for Kids Lesson',
  'English for Kids',
  'b2',
  '{
    "name": "English for Kids Lesson",
    "category": "English for Kids",
    "level": "b2",
    "colors": {
      "primary_bg": "bg-purple-50",
      "secondary_bg": "bg-pink-50",
      "text_color": "text-gray-800",
      "accent_color": "text-purple-600",
      "border_color": "border-gray-200"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/3660142/pexels-photo-3660142.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      },
      {
        "id": "meet_the_characters",
        "type": "info_card",
        "title": "Meet the Characters",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "character_introduction"
      },
      {
        "id": "warm_up_engagement",
        "type": "exercise",
        "title": "Warm-Up/Engagement",
        "instruction": "A simple question or activity to activate prior knowledge or spark curiosity.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "warm_up_engagement"
      },
      {
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Essential words/phrases with simple definitions and example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "key_vocabulary_items"
      },
      {
        "id": "story_reading_section",
        "type": "exercise",
        "title": "Story/Reading Section",
        "instruction": "A short, illustrated story or informational text.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "story_reading_content"
      },
      {
        "id": "comprehension_check",
        "type": "exercise",
        "title": "Comprehension Check",
        "instruction": "Questions to check understanding (multiple choice, true/false, or short answer).",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "pronunciation_listening_practice",
        "type": "exercise",
        "title": "Pronunciation/Listening Practice",
        "instruction": "Practice key words or phrases aloud, possibly with audio support.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "pronunciation_listening_content"
      },
      {
        "id": "speaking_role_play",
        "type": "exercise",
        "title": "Speaking/Role-Play",
        "instruction": "Prompts for students to act out a scene or ask/answer questions.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "speaking_role_play_prompts"
      },
      {
        "id": "interactive_activities",
        "type": "exercise",
        "title": "Interactive Activities",
        "instruction": "Engaging tasks such as matching, sorting, drawing, or simple games.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "interactive_activities"
      },
      {
        "id": "wrap_up_reflection",
        "type": "info_card",
        "title": "Wrap-Up/Reflection",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "wrap_up_reflection"
      }
    ]
  }'::jsonb
);
