-- Insert Business English C1 Lesson Template
INSERT INTO lesson_templates (name, category, level, template_json)
VALUES (
  'Business English Lesson',
  'Business English',
  'c1',
  '{
    "name": "Business English Lesson",
    "category": "Business English",
    "level": "c1",
    "colors": {
      "primary_bg": "bg-indigo-100",
      "secondary_bg": "bg-cyan-100",
      "text_color": "text-gray-800",
      "accent_color": "text-indigo-600",
      "border_color": "border-gray-300"
    },
    "sections": [
      {
        "id": "header",
        "type": "title",
        "title": "Lesson Title Here",
        "subtitle": "Topic Overview",
        "image_url": "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
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
        "instruction": "Essential words and phrases with definitions and example sentences, focusing on resume language.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "vocabulary_matching",
        "vocabulary_items": [
          { "image_url": "https://images.pexels.com/photos/3760072/pexels-photo-3760072.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Action Verb", "prompt": "A verb that expresses physical or mental action, often used to describe achievements on a resume." },
          { "image_url": "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Cliché", "prompt": "An overused phrase or opinion that shows a lack of original thought." },
          { "image_url": "https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", "name": "Quantifiable Result", "prompt": "A measurable outcome or achievement, typically expressed with numbers or percentages." }
        ],
        "ai_placeholder": "vocabulary_items"
      },
      {
        "id": "example_dialogue_reading",
        "type": "exercise",
        "title": "Example Dialogue or Reading",
        "instruction": "A realistic business dialogue or reading passage, such as an HR manager discussing resume mistakes or a sample resume excerpt.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "full_dialogue",
        "dialogue_lines": [],
        "ai_placeholder": "dialogue_content"
      },
      {
        "id": "comprehension_questions",
        "type": "exercise",
        "title": "Comprehension Questions",
        "instruction": "Answer these questions to check understanding.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "matching",
        "matching_pairs": [],
        "ai_placeholder": "comprehension_questions"
      },
      {
        "id": "role_play",
        "type": "exercise",
        "title": "Role-Play Scenarios",
        "instruction": "Practice real-life situations related to resume discussions or interviews.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "role_play_scenarios"
      },
      {
        "id": "discussion_questions_prompts",
        "type": "exercise",
        "title": "Discussion Questions",
        "instruction": "Share your own resume writing experiences or opinions about resume language.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "discussion_prompts"
      },
      {
        "id": "useful_expressions",
        "type": "exercise",
        "title": "Useful Expressions",
        "instruction": "Practical business phrases or alternatives to overused resume words.",
        "instruction_bg_color_var": "secondary_bg",
        "content_type": "list",
        "items": [],
        "ai_placeholder": "useful_expressions"
      },
      {
        "id": "practice_activities",
        "type": "exercise",
        "title": "Practice Activities",
        "instruction": "Activities such as editing a sample resume, identifying words to avoid, or rewriting sentences.",
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
