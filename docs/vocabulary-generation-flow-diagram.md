# Vocabulary Flashcards Generation Flow - Visual Diagram

## 🎯 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  VocabularyFlashcardsTab.tsx                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  [Start New Session] Button                             │  │  │
│  │  │  onClick → startNewSession()                            │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SESSION MANAGEMENT                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  lib/vocabulary-session.ts                                    │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  vocabularySessionManager.createSession()               │  │  │
│  │  │    ↓                                                     │  │  │
│  │  │  generateVocabularyFromAI()                             │  │  │
│  │  │    • Timeout: 30 seconds                                │  │  │
│  │  │    • Retry logic: 3 attempts                            │  │  │
│  │  │    • Error handling: Network, Timeout, Generation       │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTP POST Request
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTE                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  app/api/supabase/functions/                                  │  │
│  │  generate-vocabulary-words/route.ts                           │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  1. Validate environment variables                      │  │  │
│  │  │     • NEXT_PUBLIC_SUPABASE_URL                          │  │  │
│  │  │     • SERVICE_ROLE_KEY                                  │  │  │
│  │  │                                                          │  │  │
│  │  │  2. Create Supabase client                              │  │  │
│  │  │                                                          │  │  │
│  │  │  3. Forward request to Edge Function                    │  │  │
│  │  │     • Pass authorization header                         │  │  │
│  │  │     • Pass request body                                 │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    Supabase Function Invoke
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  supabase/functions/generate-vocabulary-words/index.ts        │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  1. Validate request                                    │  │  │
│  │  │     • student_id (required)                             │  │  │
│  │  │     • count (default: 20)                               │  │  │
│  │  │     • exclude_words (optional)                          │  │  │
│  │  │     • difficulty (optional)                             │  │  │
│  │  │                                                          │  │  │
│  │  │  2. Fetch student profile from database                 │  │  │
│  │  │     SELECT * FROM students WHERE id = student_id        │  │  │
│  │  │                                                          │  │  │
│  │  │  3. Build personalized AI prompt                        │  │  │
│  │  │     • Student name: "Zuzia"                             │  │  │
│  │  │     • Level: "B1"                                       │  │  │
│  │  │     • Native language: "Polish"                         │  │  │
│  │  │     • Learning goals: "Business English"                │  │  │
│  │  │     • Vocabulary gaps: "Technical terms"                │  │  │
│  │  │     • Exclude words: [previously seen words]            │  │  │
│  │  │                                                          │  │  │
│  │  │  4. Call Gemini API                                     │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTPS POST Request
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         GEMINI AI API                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  generativelanguage.googleapis.com                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  Model: gemini-flash-latest                             │  │  │
│  │  │  ┌───────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Configuration:                                   │  │  │  │
│  │  │  │  • temperature: 0.7                               │  │  │  │
│  │  │  │  • maxOutputTokens: 4000                          │  │  │  │
│  │  │  │  • responseMimeType: "application/json"           │  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  │  Prompt includes:                                 │  │  │  │
│  │  │  │  • Student profile details                        │  │  │  │
│  │  │  │  • Personalization requirements                   │  │  │  │
│  │  │  │  • JSON format specification                      │  │  │  │
│  │  │  │  • Example output format                          │  │  │  │
│  │  │  └───────────────────────────────────────────────────┘  │  │  │
│  │  │                                                          │  │  │
│  │  │  Generates 20 vocabulary words:                         │  │  │
│  │  │  [                                                       │  │  │
│  │  │    {                                                     │  │  │
│  │  │      "word": "opportunity",                              │  │  │
│  │  │      "pronunciation": "/ˌɑːpərˈtuːnəti/",               │  │  │
│  │  │      "partOfSpeech": "noun",                             │  │  │
│  │  │      "definition": "A chance to do something...",        │  │  │
│  │  │      "exampleSentences": {                               │  │  │
│  │  │        "present": "Every job interview...",              │  │  │
│  │  │        "past": "She recognized the...",                  │  │  │
│  │  │        "future": "This internship will...",              │  │  │
│  │  │        "presentPerfect": "Many students have...",        │  │  │
│  │  │        "pastPerfect": "He had missed...",                │  │  │
│  │  │        "futurePerfect": "By graduation, you..."          │  │  │
│  │  │      }                                                    │  │  │
│  │  │    },                                                     │  │  │
│  │  │    ... (19 more words)                                   │  │  │
│  │  │  ]                                                        │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    JSON Response (10-30 seconds)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE PROCESSING                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Edge Function validates and returns                          │  │
│  │    ↓                                                           │  │
│  │  API Route forwards response                                  │  │
│  │    ↓                                                           │  │
│  │  Session Manager processes and caches                         │  │
│  │    ↓                                                           │  │
│  │  Component displays flashcards                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      USER SEES FLASHCARDS                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  VocabularyFlashcardInterface.tsx                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  • 20 personalized vocabulary cards                     │  │  │
│  │  │  • Swipe/click navigation                               │  │  │
│  │  │  • Flip to see definition and examples                  │  │  │
│  │  │  • Progress tracking                                    │  │  │
│  │  │  • Session persistence                                  │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔴 Error Points - Where Connection Can Fail

```
┌─────────────────────────────────────────────────────────────────────┐
│  ERROR POINT 1: API Route Not Found                                 │
│  ├─ Symptom: 404 error                                              │
│  ├─ Cause: Next.js routing issue or build problem                   │
│  └─ Fix: Verify route exists, rebuild app                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ERROR POINT 2: Edge Function Not Deployed ⚠️ MOST COMMON           │
│  ├─ Symptom: "Connection Problem" or function not found             │
│  ├─ Cause: Edge Function not deployed to Supabase                   │
│  └─ Fix: supabase functions deploy generate-vocabulary-words        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ERROR POINT 3: Missing GEMINI_API_KEY Secret                       │
│  ├─ Symptom: "API key not configured" error                         │
│  ├─ Cause: Secret not set in Supabase                               │
│  └─ Fix: supabase secrets set GEMINI_API_KEY=your_key               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ERROR POINT 4: Timeout                                             │
│  ├─ Symptom: Request times out after 30 seconds                     │
│  ├─ Cause: AI generation takes too long                             │
│  └─ Fix: Increase timeout or optimize prompt                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ERROR POINT 5: Gemini API Error                                    │
│  ├─ Symptom: 400/403 from Gemini API                                │
│  ├─ Cause: Invalid API key or quota exceeded                        │
│  └─ Fix: Verify API key, check quota in Google Cloud Console        │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Request Payload:
```json
{
  "student_id": "uuid-here",
  "count": 20,
  "exclude_words": ["word1", "word2", ...],
  "difficulty": "B1",
  "focus_areas": ["business", "technology"]
}
```

### Student Profile (from database):
```json
{
  "id": "uuid",
  "name": "Zuzia",
  "target_language": "en",
  "native_language": "Polish",
  "level": "B1",
  "end_goals": "Business English, Professional communication",
  "vocabulary_gaps": "Technical terms, Business idioms",
  "conversational_fluency_barriers": "Formal presentations"
}
```

### AI Prompt (generated):
```
Generate 20 personalized English vocabulary words for Zuzia, a B1 level English learner.

Student Profile:
- Native Language: Polish
- Learning Goals: Business English, Professional communication
- Vocabulary Gaps: Technical terms, Business idioms
- Conversational Barriers: Formal presentations
- Level: B1

Requirements:
1. Generate words appropriate for B1 level
2. Focus on words that help with their learning goals
3. Address vocabulary gaps
4. Avoid these words: [previously seen words]
5. Make words relevant to their conversational barriers

For each word, provide:
- word: the English word
- pronunciation: IPA phonetic notation
- partOfSpeech: noun, verb, adjective, etc.
- definition: clear, level-appropriate definition
- exampleSentences: 6 natural, contextually relevant examples...
```

### AI Response (JSON):
```json
[
  {
    "word": "opportunity",
    "pronunciation": "/ˌɑːpərˈtuːnəti/",
    "partOfSpeech": "noun",
    "definition": "A chance to do something good or beneficial",
    "exampleSentences": {
      "present": "Every job interview presents a new opportunity to showcase your skills.",
      "past": "She recognized the opportunity and applied for the scholarship immediately.",
      "future": "This internship will provide valuable opportunity for career growth.",
      "presentPerfect": "Many students have found opportunity through networking events.",
      "pastPerfect": "He had missed several opportunity before learning to be more proactive.",
      "futurePerfect": "By graduation, Zuzia will have explored every opportunity available."
    }
  },
  ... (19 more words)
]
```

## ⏱️ Timing Breakdown

```
User clicks button                    → 0ms
Session manager called                → +10ms
API route receives request            → +50ms
Edge Function invoked                 → +100ms
Student profile fetched               → +200ms
AI prompt created                     → +250ms
Gemini API called                     → +300ms
AI generates vocabulary               → +10,000-30,000ms (10-30 seconds)
Response parsed and validated         → +30,100ms
Edge Function returns                 → +30,150ms
API route forwards response           → +30,200ms
Session manager processes             → +30,250ms
Component displays flashcards         → +30,300ms

Total time: ~30 seconds (typical)
```

## 🔐 Security Flow

```
User Authentication
    ↓
JWT Token in Authorization header
    ↓
API Route validates token
    ↓
Edge Function receives token
    ↓
Supabase validates token
    ↓
RLS policies check permissions
    ↓
Student data fetched (if authorized)
    ↓
Vocabulary generated
    ↓
Response returned to authorized user
```

## 🎯 Success Criteria

✅ All components deployed and configured
✅ Environment variables set correctly
✅ Secrets configured in Supabase
✅ Student profile exists in database
✅ Gemini API key is valid
✅ Network connection is stable
✅ Request completes within timeout
✅ AI generates valid JSON response
✅ Vocabulary cards display to user

---

**Use this diagram to:**
- Understand the complete flow
- Identify where errors occur
- Debug connection issues
- Explain the system to others
