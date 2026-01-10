# Grammar Lesson Template - Complete Sections Breakdown

**Template**: Grammar Lesson  
**Category**: Grammar  
**Levels**: A1, A2, B1, B2, C1, C2  
**Last Updated**: January 6, 2026

---

## 📋 Overview

The Grammar Lesson template is designed to teach specific grammar points through a structured, progressive approach. It includes 8 main sections that guide students from introduction through practice to reflection.

---

## 🎨 Template Colors

```json
{
  "primary_bg": "bg-yellow-50",      // Light yellow background
  "secondary_bg": "bg-orange-50",    // Light orange background
  "text_color": "text-gray-800",     // Dark gray text
  "accent_color": "text-yellow-600", // Yellow accent
  "border_color": "border-gray-200"  // Light gray borders
}
```

**Visual Theme**: Warm, inviting colors (yellow/orange) to make grammar learning feel approachable and friendly.

---

## 📚 Complete Section Breakdown

### Section 1: Header (Title Section)

**Purpose**: Introduce the lesson topic with visual appeal

**Type**: `title`

**Structure**:
```json
{
  "id": "header",
  "type": "title",
  "title": "Lesson Title Here",
  "subtitle": "Topic Overview",
  "image_url": "https://images.pexels.com/photos/..."
}
```

**AI Generation**:
- AI generates appropriate title based on grammar topic
- Creates engaging subtitle
- Selects relevant banner image

**Example Output**:
```json
{
  "title": "Mastering the Present Perfect Tense",
  "subtitle": "Learn to talk about experiences and recent actions",
  "image_url": "https://images.pexels.com/photos/1043474/..."
}
```

**Rendering**:
- Large banner image at top
- Title overlaid on image
- Subtitle below title
- Gradient overlay for text readability

---

### Section 2: Introduction/Overview

**Purpose**: Set context and explain what students will learn

**Type**: `info_card`

**Structure**:
```json
{
  "id": "introduction_overview",
  "type": "info_card",
  "title": "Introduction/Overview",
  "background_color_var": "primary_bg",
  "content_type": "text",
  "ai_placeholder": "introduction_overview"
}
```

**AI Placeholder**: `introduction_overview`

**AI Instructions**:
- Explain the grammar point in simple terms
- Provide context for when/why it's used
- Set learning objectives
- Personalize based on student's level and goals

**Example AI-Generated Content**:
```
The Present Perfect tense is used to talk about experiences in your life, 
recent actions, and things that started in the past but continue now. 

In this lesson, you'll learn:
• How to form the Present Perfect (have/has + past participle)
• When to use it vs. Simple Past
• Common time expressions (ever, never, already, yet, just)
• How to talk about your experiences naturally

This is especially useful for business conversations where you discuss 
your professional background and achievements.
```

**Rendering**:
- Card with light yellow background
- Markdown support for formatting
- Icons for bullet points
- Responsive text sizing

---

### Section 3: Key Vocabulary/Grammar Focus

**Purpose**: Introduce essential vocabulary and grammar structures

**Type**: `exercise`

**Content Type**: `vocabulary_matching`

**Structure**:
```json
{
  "id": "key_vocabulary_grammar_focus",
  "type": "exercise",
  "title": "Key Vocabulary/Grammar Focus",
  "instruction": "Essential words and phrases with example sentences...",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "vocabulary_matching",
  "vocabulary_items": [],
  "ai_placeholder": "vocabulary_grammar_focus"
}
```

**AI Placeholder**: `vocabulary_grammar_focus`

**AI Instructions**:
- Generate 5-7 vocabulary words (based on level)
- Each word must include:
  - Word/phrase
  - Phonetic notation (IPA)
  - Part of speech
  - Definition
  - 3-5 example sentences using the target grammar
- Examples should demonstrate the grammar point
- Personalize to student's interests and weaknesses

**Example AI-Generated Content**:
```json
{
  "vocabulary_items": [
    {
      "word": "experience",
      "phonetic": "/ɪkˈspɪəriəns/",
      "part_of_speech": "noun",
      "definition": "Knowledge or skill gained from doing something",
      "examples": [
        "I have experience in teaching English.",
        "She has gained valuable experience in marketing.",
        "Have you ever had experience working abroad?",
        "They have no experience with this software yet."
      ]
    },
    {
      "word": "achieve",
      "phonetic": "/əˈtʃiːv/",
      "part_of_speech": "verb",
      "definition": "To successfully complete or reach a goal",
      "examples": [
        "I have achieved my sales targets this quarter.",
        "She has achieved great success in her career.",
        "Have you achieved your learning goals?",
        "We have achieved significant progress this year."
      ]
    }
    // ... 3-5 more words
  ]
}
```

**Rendering**:
- Vocabulary cards with flip animation
- Front: Word + phonetic + part of speech
- Back: Definition + examples
- Audio pronunciation button
- Interactive matching exercise option

---

### Section 4: Example Sentences/Dialogue

**Purpose**: Show grammar in authentic context

**Type**: `exercise`

**Content Type**: `full_dialogue`

**Structure**:
```json
{
  "id": "example_sentences_dialogue",
  "type": "exercise",
  "title": "Example Sentences/Dialogue",
  "instruction": "Demonstrating the grammar in context.",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "full_dialogue",
  "dialogue_lines": [],
  "ai_placeholder": "example_content"
}
```

**AI Placeholder**: `example_content`

**AI Instructions**:
- Create 2-3 dialogues (based on level)
- Each dialogue should:
  - Feature 2 characters
  - Include 4-6 exchanges
  - Naturally use the target grammar multiple times
  - Be relevant to student's context (business, travel, etc.)
  - Include character names and roles

**Example AI-Generated Content**:
```json
{
  "dialogue_lines": [
    {
      "dialogue_id": 1,
      "title": "Job Interview",
      "characters": [
        {
          "name": "Sarah",
          "role": "Interviewer",
          "avatar_url": "default_female_1"
        },
        {
          "name": "John",
          "role": "Candidate",
          "avatar_url": "default_male_1"
        }
      ],
      "lines": [
        {
          "speaker": "Sarah",
          "text": "Tell me about your professional experience, John."
        },
        {
          "speaker": "John",
          "text": "I have worked in marketing for five years. I've managed several successful campaigns."
        },
        {
          "speaker": "Sarah",
          "text": "Have you ever led a team before?"
        },
        {
          "speaker": "John",
          "text": "Yes, I have led a team of six people for the past two years."
        },
        {
          "speaker": "Sarah",
          "text": "What achievements are you most proud of?"
        },
        {
          "speaker": "John",
          "text": "I've increased our social media engagement by 150% and have won two industry awards."
        }
      ]
    },
    {
      "dialogue_id": 2,
      "title": "Networking Event",
      "characters": [
        {
          "name": "Maria",
          "role": "Sales Manager",
          "avatar_url": "default_female_2"
        },
        {
          "name": "David",
          "role": "Marketing Director",
          "avatar_url": "default_male_2"
        }
      ],
      "lines": [
        {
          "speaker": "Maria",
          "text": "Hi David! Have we met before?"
        },
        {
          "speaker": "David",
          "text": "I don't think so. I've just joined the company last month."
        },
        {
          "speaker": "Maria",
          "text": "Welcome! Have you attended any of our training sessions yet?"
        },
        {
          "speaker": "David",
          "text": "Yes, I've already completed the onboarding program. It was very helpful!"
        }
      ]
    }
  ]
}
```

**Rendering**:
- Character avatars with speech bubbles
- Alternating left/right layout
- Audio playback for each line
- Highlighting of target grammar structures
- Character-specific styling

---

### Section 5: Comprehension Questions/Practice

**Purpose**: Check understanding and provide practice

**Type**: `exercise`

**Content Type**: `matching`

**Structure**:
```json
{
  "id": "comprehension_practice",
  "type": "exercise",
  "title": "Comprehension Questions/Practice",
  "instruction": "Check your understanding and practice the grammar point.",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "matching",
  "matching_pairs": [],
  "ai_placeholder": "comprehension_practice"
}
```

**AI Placeholder**: `comprehension_practice`

**AI Instructions**:
- Create 5-8 matching pairs (based on level)
- Types of exercises:
  - Match sentence halves
  - Match questions to answers
  - Match grammar forms to uses
  - Match errors to corrections
- Ensure all items use the target grammar
- Include distractors that test common mistakes

**Example AI-Generated Content**:
```json
{
  "matching_pairs": [
    {
      "left": "I ___ (live) in London for three years.",
      "right": "have lived",
      "explanation": "Use Present Perfect for actions that started in the past and continue now."
    },
    {
      "left": "She ___ (finish) her report yet.",
      "right": "hasn't finished",
      "explanation": "Use 'yet' with negative Present Perfect for actions not completed."
    },
    {
      "left": "___ you ever ___ (visit) Japan?",
      "right": "Have / visited",
      "explanation": "Use 'ever' with Present Perfect to ask about life experiences."
    },
    {
      "left": "They ___ (just/arrive) at the office.",
      "right": "have just arrived",
      "explanation": "'Just' goes between 'have' and the past participle."
    },
    {
      "left": "He ___ (work) here since 2020.",
      "right": "has worked",
      "explanation": "Use 'since' with a specific time point."
    }
  ]
}
```

**Rendering**:
- Interactive drag-and-drop interface
- Two columns: left items and right items
- Visual feedback on correct/incorrect matches
- Explanation shown after matching
- Score tracking
- Retry option

---

### Section 6: Discussion/Production Prompts

**Purpose**: Encourage active use of the grammar

**Type**: `exercise`

**Content Type**: `list`

**Structure**:
```json
{
  "id": "discussion_production_prompts",
  "type": "exercise",
  "title": "Discussion/Production Prompts",
  "instruction": "Use the grammar to talk about yourself.",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "list",
  "items": [],
  "ai_placeholder": "discussion_prompts"
}
```

**AI Placeholder**: `discussion_prompts`

**AI Instructions**:
- Generate 5-7 discussion prompts
- Each prompt should:
  - Require use of the target grammar
  - Be personally relevant to the student
  - Encourage extended responses
  - Build from simple to complex
- Include follow-up questions

**Example AI-Generated Content**:
```json
{
  "items": [
    "Talk about three important achievements in your career. Use: 'I have...'",
    "Describe a skill you have learned recently. When did you start? Are you still learning?",
    "Have you ever worked on an international project? Tell me about your experience.",
    "What changes have you seen in your industry since you started working?",
    "Discuss a goal you haven't achieved yet but are working towards.",
    "Have you ever had to learn a new technology quickly? How did it go?",
    "What's the most interesting place you have visited for work? What did you do there?"
  ]
}
```

**Rendering**:
- Numbered list with icons
- Expandable cards for each prompt
- Text area for student responses (optional)
- Recording option for speaking practice
- Timer for timed practice

---

### Section 7: Useful Expressions

**Purpose**: Provide practical phrases for real-world use

**Type**: `exercise`

**Content Type**: `list`

**Structure**:
```json
{
  "id": "useful_expressions",
  "type": "exercise",
  "title": "Useful Expressions",
  "instruction": "Practical phrases or sentence starters...",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "list",
  "items": [],
  "ai_placeholder": "useful_expressions"
}
```

**AI Placeholder**: `useful_expressions`

**AI Instructions**:
- Generate 6-10 useful expressions
- Each expression should:
  - Use the target grammar naturally
  - Be immediately practical
  - Include context for when to use it
  - Be appropriate for student's goals (business, travel, etc.)

**Example AI-Generated Content**:
```json
{
  "items": [
    "I've been working on... (to talk about current projects)",
    "I've never had the chance to... (to express missed opportunities)",
    "Have you had any experience with...? (to ask about someone's background)",
    "I've just finished... (to announce recent completion)",
    "I haven't had time to... yet (to explain delays politely)",
    "We've already discussed... (to reference previous conversations)",
    "I've always wanted to... (to express long-term desires)",
    "Have you ever considered...? (to suggest ideas)",
    "I've recently started... (to share new activities)",
    "We haven't met before, have we? (to confirm first meeting)"
  ]
}
```

**Rendering**:
- Clean list with checkboxes
- Copy-to-clipboard button for each phrase
- Audio pronunciation
- Usage context in smaller text
- Favorite/bookmark option

---

### Section 8: Practice Activities

**Purpose**: Provide additional practice exercises

**Type**: `exercise`

**Content Type**: `list`

**Structure**:
```json
{
  "id": "practice_activities",
  "type": "exercise",
  "title": "Practice Activities",
  "instruction": "Interactive activities to reinforce learning.",
  "instruction_bg_color_var": "secondary_bg",
  "content_type": "list",
  "items": [],
  "ai_placeholder": "practice_activities"
}
```

**AI Placeholder**: `practice_activities`

**AI Instructions**:
- Generate 4-6 practice activities
- Variety of activity types:
  - Fill-in-the-blank exercises
  - Sentence transformation
  - Error correction
  - Writing prompts
  - Speaking challenges
- Progressive difficulty
- Clear instructions for each

**Example AI-Generated Content**:
```json
{
  "items": [
    "Complete the sentences with the correct form of the verb in brackets:\n1. I ___ (work) here since 2020.\n2. She ___ (not/finish) her presentation yet.\n3. ___ you ever ___ (meet) a celebrity?",
    
    "Rewrite these sentences using the Present Perfect:\n1. I started learning English in 2019. I still learn it. → I have been learning English since 2019.\n2. She finished the report five minutes ago. → She has just finished the report.",
    
    "Find and correct the mistakes:\n1. I have went to Paris last year. ✗\n2. She has worked here for 2020. ✗\n3. Have you ever been to Japan? ✓",
    
    "Write 5 sentences about your professional experience using the Present Perfect. Include: achievements, skills learned, projects completed, places visited, people met.",
    
    "Speaking Challenge: Record yourself answering these questions:\n• What have you achieved this year?\n• What skills have you developed?\n• What challenges have you overcome?",
    
    "Create a dialogue between two colleagues discussing their work experience. Use at least 8 Present Perfect sentences."
  ]
}
```

**Rendering**:
- Accordion-style expandable sections
- Interactive input fields for written exercises
- Submit and check answers functionality
- Immediate feedback with explanations
- Progress tracking across activities

---

### Section 9: Wrap-up & Reflection

**Purpose**: Summarize learning and encourage reflection

**Type**: `info_card`

**Structure**:
```json
{
  "id": "wrap_up_reflection",
  "type": "info_card",
  "title": "Wrap-up & Reflection",
  "background_color_var": "primary_bg",
  "content_type": "text",
  "ai_placeholder": "wrap_up_reflection"
}
```

**AI Placeholder**: `wrap_up_reflection`

**AI Instructions**:
- Summarize key learning points
- Provide encouragement
- Suggest next steps
- Include reflection questions
- Personalize based on student's goals

**Example AI-Generated Content**:
```
Great work! You've learned how to use the Present Perfect tense to talk about 
your experiences and achievements.

Key Takeaways:
✓ Form: have/has + past participle
✓ Use for: experiences, recent actions, actions continuing from past to present
✓ Time expressions: ever, never, already, yet, just, since, for
✓ Difference from Simple Past: Present Perfect connects past to present

Reflection Questions:
• Which part of the Present Perfect do you find most challenging?
• How will you use this grammar in your work conversations?
• What other grammar points would help you communicate better?

Next Steps:
• Practice using Present Perfect in your daily conversations
• Pay attention to how native speakers use it in meetings and emails
• Review the useful expressions before your next business presentation

Remember: Making mistakes is part of learning. Keep practicing, and you'll 
master this grammar point!
```

**Rendering**:
- Card with light yellow background
- Checkmarks for key takeaways
- Question marks for reflection questions
- Arrow icons for next steps
- Encouraging tone with emojis
- Print/save lesson button

---

## 🔄 Section Flow Logic

```
1. HEADER
   ↓ (Visual hook)
   
2. INTRODUCTION
   ↓ (Context setting)
   
3. VOCABULARY/GRAMMAR FOCUS
   ↓ (Building blocks)
   
4. EXAMPLE SENTENCES/DIALOGUE
   ↓ (See it in action)
   
5. COMPREHENSION PRACTICE
   ↓ (Check understanding)
   
6. DISCUSSION PROMPTS
   ↓ (Active production)
   
7. USEFUL EXPRESSIONS
   ↓ (Practical application)
   
8. PRACTICE ACTIVITIES
   ↓ (Reinforce learning)
   
9. WRAP-UP & REFLECTION
   ↓ (Consolidate & plan)
```

---

## 🎯 AI Generation Rules

### General Rules
1. **Personalization**: Every section must be personalized based on:
   - Student's proficiency level
   - Native language
   - End goals (business, travel, academic, etc.)
   - Specific weaknesses
   - Learning style preferences

2. **Grammar Focus**: All content must demonstrate the target grammar point naturally

3. **Progression**: Content difficulty increases from introduction to practice

4. **Relevance**: Examples and contexts match student's real-world needs

### Level-Specific Rules

**A1/A2 (Beginner)**:
- Simple vocabulary
- Short sentences
- Clear, explicit explanations
- More examples per concept
- Basic contexts (daily life, simple work situations)

**B1/B2 (Intermediate)**:
- More complex vocabulary
- Longer, compound sentences
- Implicit grammar rules (learn through examples)
- Professional contexts
- Idiomatic expressions introduced

**C1/C2 (Advanced)**:
- Sophisticated vocabulary
- Complex sentence structures
- Nuanced explanations
- Advanced professional/academic contexts
- Subtle grammar distinctions

---

## 📊 Content Generation Specifications

### Vocabulary Items
- **Count**: 5-7 words (varies by level)
- **Examples per word**: 
  - A1/A2: 5 examples
  - B1/B2: 4 examples
  - C1/C2: 3 examples
- **Must include**: phonetic, part of speech, definition, examples

### Dialogues
- **Count**: 2-3 dialogues
- **Lines per dialogue**: 4-8 exchanges
- **Characters**: 2 per dialogue
- **Grammar usage**: Minimum 3 instances per dialogue

### Matching Pairs
- **Count**: 5-8 pairs
- **Types**: Mixed (fill-in-blank, Q&A, form-to-use, error correction)
- **Difficulty**: Progressive

### Discussion Prompts
- **Count**: 5-7 prompts
- **Complexity**: Simple → Complex
- **Personalization**: High (based on student profile)

### Useful Expressions
- **Count**: 6-10 expressions
- **Format**: Expression + context
- **Practicality**: Immediately usable

### Practice Activities
- **Count**: 4-6 activities
- **Variety**: Different exercise types
- **Instructions**: Clear and actionable

---

## 🎨 Visual Rendering

### Color Scheme
- **Primary Background**: Light yellow (`bg-yellow-50`)
- **Secondary Background**: Light orange (`bg-orange-50`)
- **Text**: Dark gray (`text-gray-800`)
- **Accents**: Yellow (`text-yellow-600`)
- **Borders**: Light gray (`border-gray-200`)

### Typography
- **Headings**: Bold, larger font
- **Body**: Regular weight, readable size
- **Instructions**: Italic, slightly smaller
- **Examples**: Monospace for code/grammar

### Interactive Elements
- **Buttons**: Rounded, shadow on hover
- **Cards**: Subtle shadow, hover lift effect
- **Inputs**: Clear borders, focus states
- **Feedback**: Green for correct, red for incorrect

---

## 🔧 Technical Implementation

### Template Storage
- **Location**: `lesson_templates` table in Supabase
- **Format**: JSONB column
- **Versioning**: Timestamp-based migrations

### AI Processing
- **Model**: DeepSeek Chat via OpenRouter
- **Temperature**: 0.1 (consistent output)
- **Max Tokens**: 4000
- **Validation**: JSON structure validation + content validation

### Rendering
- **Component**: `LessonMaterialDisplay.tsx`
- **Section Mapping**: Type-based component selection
- **Interactivity**: React state management
- **Persistence**: Supabase database

---

## 📝 Example Complete Lesson

**Topic**: Present Perfect Tense  
**Level**: B1  
**Student**: Business professional, Spanish native, wants to improve meeting skills

**Generated Sections**:
1. ✅ Header: "Mastering the Present Perfect Tense"
2. ✅ Introduction: Explains usage in business contexts
3. ✅ Vocabulary: 6 words (experience, achieve, accomplish, etc.)
4. ✅ Dialogues: Job interview + Networking event
5. ✅ Practice: 7 matching pairs
6. ✅ Discussion: 6 prompts about career achievements
7. ✅ Expressions: 8 business-appropriate phrases
8. ✅ Activities: 5 varied exercises
9. ✅ Wrap-up: Summary + reflection questions

**Total Generation Time**: 15-20 seconds  
**Content Quality**: Highly personalized, contextually relevant, grammatically accurate

---

## 🚀 Best Practices

### For AI Prompt Construction
1. Include complete student profile
2. Specify exact grammar point
3. Provide clear formatting instructions
4. Include validation rules
5. Request specific counts for each section

### For Content Validation
1. Check JSON structure integrity
2. Validate vocabulary example counts
3. Verify dialogue character consistency
4. Ensure grammar point is demonstrated
5. Confirm personalization elements

### For User Experience
1. Progressive disclosure (expandable sections)
2. Clear visual hierarchy
3. Immediate feedback on interactions
4. Mobile-responsive design
5. Accessibility compliance (ARIA labels, keyboard navigation)

---

## 📚 Related Documentation

- [Interactive Material Generation Flow](./interactive-material-generation-visual-flow.md)
- [Lesson Sections Creation Guide](./lesson-sections-creation-guide.md)
- [Grammar Explanation Generation Analysis](./grammar-explanation-generation-analysis.md)
- [Vocabulary Enhancement Summary](./vocabulary-enhancement-summary.md)

---

**Last Updated**: January 6, 2026  
**Template Version**: 1.0  
**Maintained By**: Development Team
