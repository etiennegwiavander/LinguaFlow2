-- Insert Grammar B1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Grammar Lesson',
  'Grammar',
  'b1',
  '{
    "name": "Grammar Lesson",
    "category": "Grammar",
    "level": "b1",
    "colors": {
      "primary_bg": "bg-purple-50",
      "secondary_bg": "bg-indigo-50",
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
        "image_url": "https://images.pexels.com/photos/3850996/pexels-photo-3850996.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "instruction": "Essential words and phrases with definitions and example sentences, focused on abilities and common verbs.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "grammar_explanation",
        "type": "exercise",
        "title": "Grammar Explanation",
        "instruction": "Brief, clear explanation of the target grammar, with example sentences. (e.g., how to use 'can' and 'can’t' for ability).",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "grammar_explanation"
      },
      {
        "id": "example_dialogue",
        "type": "exercise",
        "title": "Example Dialogue",
        "instruction": "A short, simple conversation demonstrating the grammar in context.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_practice_questions",
        "type": "exercise",
        "title": "Comprehension/Practice Questions",
        "instruction": "Answer these questions about yourself or the dialogue.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "guided_practice_fill_in_the_blank",
        "type": "exercise",
        "title": "Guided Practice/Fill-in-the-Blank",
        "instruction": "Fill-in-the-blank or matching exercises using 'can' and 'can’t'.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "fill_in_the_blanks_dialogue",
        "dialogue_elements": [],
        "ai_placeholder": "fill_in_the_blanks_content"
      },
      {
        "id": "speaking_practice_role_play",
        "type": "exercise",
        "title": "Speaking Practice/Role-Play",
        "instruction": "Practice asking and answering about abilities with a partner.",
        "instruction_bg_color_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "speaking_practice_prompts"
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
