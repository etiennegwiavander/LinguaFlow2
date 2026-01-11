-- Insert Grammar A2 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Grammar Lesson',
  'Grammar',
  'a2',
  '{
    "name": "Grammar Lesson",
    "category": "Grammar",
    "level": "a2",
    "colors": {
      "primary_bg": "bg-yellow-50",
      "secondary_bg": "bg-orange-50",
      "text_color": "text-gray-800",
      "accent_color": "text-yellow-600",
      "border_color": "border-gray-200"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "id": "useful_expressions",
        "type": "exercise",
        "title": "Useful Expressions",
        "instruction": "Practical phrases or sentence starters for expressing feelings.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
      },      
      {
        "id": "key_vocabulary_grammar_focus",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Essential words and phrases with example sentences using the target grammar structure.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_grammar_focus"
      },
      {
        "id": "grammar_explanation",
        "type": "exercise",
        "title": "Grammar Explanation",
        "instruction": "Brief, clear explanation of the target grammar, with example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "text",
        "ai_placeholder": "grammar_explanation"
      },
      {
        "id": "example_sentences_dialogue",
        "type": "exercise",
        "title": "Dialogue",
        "instruction": "Demonstrating the grammar in context.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "example_content"
      },
      {
        "id": "comprehension_practice",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Check your understanding and practice the grammar point.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_practice"
      },
      {
        "id": "discussion_production_prompts",
        "type": "exercise",
        "title": "Discussion",
        "instruction": "Use the grammar to talk about yourself.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Interactive activities to reinforce learning.",
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
