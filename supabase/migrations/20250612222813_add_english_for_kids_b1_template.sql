-- Insert English for Kids B1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'English for Kids Lesson',
  'English for Kids',
  'b1',
  '{
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
        "id": "learning_objectives",
        "type": "info_card",
        "title": "Learning Objectives",
        "background_color_var": "primary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "objectives"
      },
      {
        "id": "warm_up",
        "type": "exercise",
        "title": "Warm-up",
        "instruction": "Match the words with the pictures.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "drawing_tool_match",
        "items": [],
        "ai_placeholder": "warmup_content"
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
        "id": "which_picture",
        "type": "exercise",
        "title": "Which Picture?",
        "instruction": "Listen to the dialogue and choose the correct picture.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "audio_picture_choice",
        "items": [],
        "ai_placeholder": "audio_picture_choices"
      },
      {
        "id": "say_what_you_see",
        "type": "exercise",
        "title": "Say What You See",
        "instruction": "Your tutor will choose a picture. Describe it using singular and plural nouns.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "say_what_you_see",
        "items": [],
        "ai_placeholder": "say_what_you_see_items"
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
        "id": "answer_the_questions",
        "type": "exercise",
        "title": "Answer the Questions",
        "instruction": "Look at the picture and answer the question in a complete sentence.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "answer_questions",
        "items": [],
        "ai_placeholder": "answer_questions_items"
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
      }
    ]
  }'::jsonb
);
