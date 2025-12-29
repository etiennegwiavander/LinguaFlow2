-- Update English for Kids B1 Template to remove image/audio-dependent sections
-- and change warm-up to vocabulary translation matching

UPDATE lesson_templates
SET template_json = '{
    "name": "English for Kids Lesson",
    "category": "English for Kids",
    "level": "b1",
    "colors": {
      "primary_bg": "bg-indigo-50",
      "secondary_bg": "bg-pink-50",
      "text_color": "text-gray-800",
      "accent_color": "text-indigo-600",
      "border_color": "border-gray-200"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      },
      {
        "id": "introduction_overview",
        "type": "info_card",
        "title": "Learning Objectives",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "introduction_overview"
      },
      {
        "id": "warm_up",
        "type": "exercise",
        "title": "Warm-up",
        "instruction": "Match the English words with their translations in your native language.",
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
        "id": "listen_and_repeat",
        "type": "exercise",
        "title": "Listen and Repeat",
        "instruction": "Listen to your tutor and repeat the sentences.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "listen_repeat",
        "items": [],
        "ai_placeholder": "listen_repeat_sentences"
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
        "id": "fill_in_the_blanks",
        "type": "exercise",
        "title": "Fill in the Blanks",
        "instruction": "Read the dialogue with your tutor and fill in the missing words.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "fill_in_the_blanks_dialogue",
        "dialogue_elements": [],
        "ai_placeholder": "fill_in_the_blanks_content"
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
        "id": "review_wrap_up",
        "type": "info_card",
        "title": "Review/Wrap-up",
        "background_color_var": "primary_bg",
        "content_type": "text",
        "ai_placeholder": "review_wrap_up"
      }
    ]
  }'::jsonb
WHERE category = 'English for Kids' AND level = 'b1';
