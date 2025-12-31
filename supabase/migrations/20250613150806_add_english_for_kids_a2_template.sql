-- Insert English for Kids A2 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'English for Kids Lesson',
  'English for Kids',
  'a2',
  '{
    "name": "English for Kids Lesson",
    "category": "English for Kids",
    "level": "a2",
    "colors": {
      "primary_bg": "bg-teal-50",
      "secondary_bg": "bg-lime-50",
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
        "image_url": "https://images.pexels.com/photos/3660142/pexels-photo-3660142.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "id": "key_vocabulary",
        "type": "exercise",
        "title": "Key Vocabulary",
        "instruction": "Essential words with simple definitions and example sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "example_sentences_dialogue",
        "type": "exercise",
        "title": "Example Sentences/Dialogue",
        "instruction": "Short, simple sentences or a dialogue to model the target language.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "example_content"
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
        "id": "guided_practice_matching_exercise",
        "type": "exercise",
        "title": "Guided Practice/Matching Exercise",
        "instruction": "Match words to pictures or complete fill-in-the-blank activities.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "guided_practice_content"
      },
      {
        "id": "complete_the_sentence",
        "type": "exercise",
        "title": "Complete the Sentence",
        "instruction": "Choose the correct word to complete the sentence, then read it aloud.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "complete_sentence",
        "items": [],
        "ai_placeholder": "complete_sentence_items"
      },
      {
        "id": "speaking_practice_role_play",
        "type": "exercise",
        "title": "Speaking Practice/Role-Play",
        "instruction": "Practice asking and answering about wants and needs.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "speaking_practice_prompts"
      },
      {
        "id": "review_wrap_up",
        "type": "info_card",
        "title": "Review/Wrap-up",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "review_wrap_up"
      }
    ]
  }'::jsonb
);
