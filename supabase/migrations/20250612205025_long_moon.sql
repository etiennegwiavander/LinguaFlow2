-- Insert A1 Conversation Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'A1 Conversation Lesson',
  'Conversation',
  'a1',
  '{
    "name": "A1 Conversation Lesson",
    "category": "Conversation",
    "level": "a1",
    "colors": {
      "primary_bg": "bg-blue-100",
      "secondary_bg": "bg-green-100",
      "text_color": "text-gray-800",
      "accent_color": "text-blue-600",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Nice To Meet You",
        "subtitle": "Conversation Lesson"
      },
      {
        "id": "learning_objectives",
        "type": "info_card",
        "title": "Learning Objectives",
        "background_color_var": "primary_bg",
        "content_type": "list",
        "items": [
          "Practice the alphabet.",
          "Learn how to give and get your name and family name."
        ],
        "ai_placeholder": "objectives"
      },
      {
        "id": "exercise_1_warmup",
        "type": "exercise",
        "title": "Exercise 1: Warm-up",
        "instruction": "Listen and repeat the alphabet.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [
          "A, B, C", "D, E, F", "G, H, I", "J, K, L", "M, N, O", "P, Q, R", "S, T, U", "V, W, X", "Y, Z"
        ],
        "ai_placeholder": "warmup_content"
      },
      {
        "id": "lets_practice_1",
        "type": "exercise",
        "title": "Let''s Practice",
        "instruction": "Imagine you''re meeting a new friend.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "dialogue_practice",
        "dialogue_elements": [
          { "type": "character_speech", "character": "Ling", "text": "How do you spell your name?" },
          { "type": "user_input", "label": "Tutor", "placeholder": "..." },
          { "type": "user_input", "label": "Student", "placeholder": "..." },
          { "type": "multiple_choice", "question": "Choose an answer from the options below that fits in blank 1:", "options": ["Ling", "Haruto", "Arisa", "John"] }
        ],
        "ai_placeholder": "practice_dialogue_1"
      },
      {
        "id": "exercise_2_vocabulary",
        "type": "exercise",
        "title": "Exercise 2: Vocabulary",
        "instruction": "Listen and repeat the names and occupations.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [
          { "image_url": "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Hyunwoo Park", "prompt": "My last name is Park." },
          { "image_url": "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Arisa Suzuki", "prompt": "My last name is Suzuki." },
          { "image_url": "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Hanako Tanaka", "prompt": "My last name is Tanaka." },
          { "image_url": "https://images.pexels.com/photos/1043470/pexels-photo-1043470.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Ling Chen", "prompt": "My last name is Chen." }
        ],
        "ai_placeholder": "vocabulary_content"
      },
      {
        "id": "lets_practice_2",
        "type": "exercise",
        "title": "Let''s Practice",
        "instruction": "Imagine you''re meeting a new friend.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "dialogue_practice",
        "dialogue_elements": [
          { "type": "character_speech", "character": "Ling", "text": "What is your name?" },
          { "type": "user_input", "label": "My", "placeholder": "..." },
          { "type": "character_speech", "character": "Haruto", "text": "How do you spell your name?" },
          { "type": "user_input", "label": "H", "placeholder": "..." },
          { "type": "multiple_choice", "question": "Choose an answer from the options below that fits in blank 1 to 4:", "options": ["too", "name", "right", "welcome"] }
        ],
        "ai_placeholder": "practice_dialogue_2"
      },
      {
        "id": "exercise_3_dialogue",
        "type": "exercise",
        "title": "Exercise 3: Dialogue",
        "instruction": "Read the dialogue and practice with your tutor. Then, recall the answers.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [
          { "character": "Tutor", "text": "Hello, my name is Emily. Nice to meet you." },
          { "character": "Student", "text": "Hello Emily. Nice to meet you too." },
          { "character": "Tutor", "text": "What is your name?" },
          { "character": "Student", "text": "My name is Hyunwoo Park." },
          { "character": "Tutor", "text": "How do you spell Park?" },
          { "character": "Student", "text": "P. A. R. K." },
          { "character": "Tutor", "text": "Are you Korean, right?" },
          { "character": "Student", "text": "Yes, that''s right." },
          { "character": "Tutor", "text": "What''s your family name?" },
          { "character": "Student", "text": "My family name is Park." },
          { "character": "Tutor", "text": "How do you spell that?" },
          { "character": "Student", "text": "P. A. R. K." },
          { "character": "Tutor", "text": "Thank you." },
          { "character": "Student", "text": "You''re welcome." }
        ],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "exercise_4_matching",
        "type": "exercise",
        "title": "Exercise 4: Matching",
        "instruction": "Match the questions from the dialogue to the answers.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [
          { "question": "1. Nice to meet you.", "answers": ["a. Nice to meet you too.", "b. You''re welcome.", "c. My name is Hyunwoo Park."] },
          { "question": "2. Are you Korean, right?", "answers": ["a. Yes, that''s right.", "b. No, that''s not.", "c. My name is Hyunwoo Park."] },
          { "question": "3. What''s your family name?", "answers": ["a. My family name is Park.", "b. My family name is Kim.", "c. My family name is Lee."] },
          { "question": "4. Thank you.", "answers": ["a. You''re welcome.", "b. Nice to meet you.", "c. My name is Hyunwoo Park."] }
        ],
        "ai_placeholder": "matching_content"
      },
      {
        "id": "exercise_5_fill_in_the_blanks",
        "type": "exercise",
        "title": "Exercise 5: Fill in the Blanks",
        "instruction": "Read the dialogue and fill in the blanks. Then, answer the questions.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "fill_in_the_blanks_dialogue",
        "dialogue_elements": [
          { "character": "Tutor", "text": "Hello, my name is Emily. Nice to meet you." },
          { "character": "Student", "text": "Hello Emily. Nice to meet you __1__." },
          { "type": "multiple_choice", "question": "Choose an answer from the options below that fits in blank 1:", "options": ["too", "to", "two"] },
          { "character": "Tutor", "text": "What is your name?" },
          { "character": "Student", "text": "My __2__ is Hyunwoo Park." },
          { "type": "multiple_choice", "question": "Choose an answer from the options below that fits in blank 2:", "options": ["name", "family", "first"] },
          { "character": "Tutor", "text": "How do you spell your name?" },
          { "character": "Student", "text": "P. A. R. K." },
          { "character": "Tutor", "text": "Are you Korean, __3__?" },
          { "type": "multiple_choice", "question": "Choose an answer from the options below that fits in blank 3:", "options": ["right", "wrong", "correct"] },
          { "character": "Student", "text": "Yes, that''s right." },
          { "character": "Tutor", "text": "What''s your family name?" },
          { "character": "Student", "text": "My family name is Park." },
          { "character": "Tutor", "text": "How do you spell that?" },
          { "character": "Student", "text": "P. A. R. K." },
          { "character": "Tutor", "text": "Thank you." },
          { "character": "Student", "text": "You''re __4__." },
          { "type": "multiple_choice", "question": "Choose an answer from the options below that fits in blank 4:", "options": ["welcome", "well", "good"] }
        ],
        "ai_placeholder": "fill_in_the_blanks_content"
      },
      {
        "id": "exercise_6_ordering",
        "type": "exercise",
        "title": "Exercise 6: Ordering",
        "instruction": "Put the words in the correct order.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "ordering",
        "ordering_items": [
          "\"Nice to meet you.\" → Nice to meet you.",
          "is your name what?",
          "name family your is what?",
          "spell you do how name your?",
          "right that''s yes",
          "family my is name",
          "welcome you''re"
        ],
        "ai_placeholder": "ordering_content"
      },
      {
        "id": "exercise_7_your_turn_to_ask",
        "type": "exercise",
        "title": "Exercise 7: Your Turn to Ask",
        "instruction": "Ask your tutor questions based on the dialogue.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [
          "Hello.",
          "Nice to meet you.",
          "What is your name?",
          "What is your family name?",
          "How do you spell your name?",
          "Thank you."
        ],
        "ai_placeholder": "your_turn_to_ask_content"
      },
      {
        "id": "exercise_8_your_turn_to_answer",
        "type": "exercise",
        "title": "Exercise 8: Your Turn to Answer",
        "instruction": "Answer the questions your tutor asks based on the dialogue.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [
          "Hello.",
          "Nice to meet you.",
          "What is your name?",
          "What is your family name?",
          "How do you spell your name?",
          "Thank you."
        ],
        "ai_placeholder": "your_turn_to_answer_content"
      }
    ]
  }'::jsonb
);