-- Insert Grammar C2 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Grammar Lesson',
  'Grammar',
  'c2',
  '{
    "name": "Grammar Lesson",
    "category": "Grammar",
    "level": "c2",
    "colors": {
      "primary_bg": "bg-blue-50",
      "secondary_bg": "bg-gray-100",
      "text_color": "text-gray-800",
      "accent_color": "text-blue-700",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "instruction": "Key words and phrases and a concise grammar explanation with example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "vocabulary_grammar_focus"
      },
      {
        "id": "example_sentences_dialogue",
        "type": "exercise",
        "title": "Example Sentences/Dialogue",
        "instruction": "Demonstrating the grammar in context.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_practice_questions",
        "type": "exercise",
        "title": "Comprehension/Practice Questions",
        "instruction": "Check understanding and practice the grammar point.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "discussion_production_prompts",
        "type": "exercise",
        "title": "Discussion/Production Prompts",
        "instruction": "Encouraging students to use the grammar to talk about their own experiences or hypothetical past situations.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "useful_expressions",
        "type": "exercise",
        "title": "Useful Expressions",
        "instruction": "Practical phrases or sentence starters for using third conditional/inverted conditionals.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Activities such as rewriting sentences, correcting mistakes, or short role-plays using the target grammar.",
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
