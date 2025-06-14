-- Insert Grammar A1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Grammar Lesson',
  'Grammar',
  'a1',
  '{
    "name": "Grammar Lesson",
    "category": "Grammar", 
    "level": "a1",
    "colors": {
      "primary_bg": "bg-green-50",
      "secondary_bg": "bg-blue-50",
      "text_color": "text-gray-800",
      "accent_color": "text-green-600",
      "border_color": "border-gray-200"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/5940837/pexels-photo-5940837.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "instruction": "Essential words and phrases with definitions and example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "grammar_explanation",
        "type": "exercise",
        "title": "Grammar Explanation",
        "instruction": "Clear, concise explanation of the grammar point.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "grammar_explanation",
        "explanation_content": "",
        "ai_placeholder": "grammar_explanation"
      },
      {
        "id": "example_sentences",
        "type": "exercise",
        "title": "Example Sentences",
        "instruction": "Several example sentences using the target grammar.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "example_sentences",
        "sentences": [],
        "ai_placeholder": "example_sentences"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Activities such as fill-in-the-blank exercises, sentence matching, or short dialogues.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "practice_activities"
      },
      {
        "id": "dialogue_short_conversation",
        "type": "exercise",
        "title": "Dialogue/Short Conversation",
        "instruction": "A short, simple conversation using the target grammar.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_review_questions",
        "type": "exercise",
        "title": "Comprehension/Review Questions",
        "instruction": "Check your understanding.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
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
