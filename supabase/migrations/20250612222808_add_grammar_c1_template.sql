-- Insert Grammar C1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Grammar Lesson',
  'Grammar',
  'c1',
  '{
    "name": "Grammar Lesson",
    "category": "Grammar",
    "level": "c1",
    "colors": {
      "primary_bg": "bg-teal-50",
      "secondary_bg": "bg-cyan-50",
      "text_color": "text-gray-800",
      "accent_color": "text-teal-600",
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
        "id": "key_vocabulary_grammar_focus",
        "type": "exercise",
        "title": "Key Vocabulary/Grammar Focus",
        "instruction": "Essential words and phrases with definitions and example sentences using the target grammar.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_grammar_focus"
      },
      {
        "id": "grammar_explanation",
        "type": "exercise",
        "title": "Grammar Explanation",
        "instruction": "Clear, concise explanation of the grammar point, with example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "grammar_explanation"
      },
      {
        "id": "example_dialogue",
        "type": "exercise",
        "title": "Example Dialogue",
        "instruction": "A short, realistic conversation between two characters using the target grammar.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_practice_questions",
        "type": "exercise",
        "title": "Comprehension/Practice Questions",
        "instruction": "Check your understanding and encourage practice with the target grammar.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "guided_practice_fill_in_the_blank",
        "type": "exercise",
        "title": "Guided Practice/Fill-in-the-Blank",
        "instruction": "Fill-in-the-blank or sentence transformation exercises using the target grammar.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "fill_in_the_blanks_dialogue",
        "dialogue_elements": [],
        "ai_placeholder": "fill_in_the_blanks_content"
      },
      {
        "id": "speaking_practice_role_play",
        "type": "exercise",
        "title": "Speaking Practice/Role-Play",
        "instruction": "Practice asking and answering hypothetical questions with a partner.",
        "instruction_bg_color_var": "secondary_bg",
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
