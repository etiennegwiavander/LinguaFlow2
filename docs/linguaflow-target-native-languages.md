# LinguaFlow - Target & Native Languages Breakdown

## Overview
LinguaFlow supports **12 languages** that can be used as either **target languages** (what students are learning) or **native languages** (students' first language).

---

## 🌍 Supported Languages

### Complete Language List:

| # | Language | Code | Flag | Region |
|---|----------|------|------|--------|
| 1 | **English** | `en` | 🇬🇧 | United Kingdom / Global |
| 2 | **Spanish** | `es` | 🇪🇸 | Spain / Latin America |
| 3 | **French** | `fr` | 🇫🇷 | France / Francophone |
| 4 | **Polish** | `pl` | 🇵🇱 | Poland |
| 5 | **German** | `de` | 🇩🇪 | Germany / DACH Region |
| 6 | **Italian** | `it` | 🇮🇹 | Italy |
| 7 | **Japanese** | `ja` | 🇯🇵 | Japan |
| 8 | **Korean** | `ko` | 🇰🇷 | South Korea |
| 9 | **Chinese** | `zh` | 🇨🇳 | China / Mandarin |
| 10 | **Russian** | `ru` | 🇷🇺 | Russia |
| 11 | **Portuguese** | `pt` | 🇵🇹 | Portugal / Brazil |
| 12 | **Slovak** | `sk` | 🇸🇰 | Slovakia |

---

## 🎯 Target Language (What Students Learn)

### Definition:
The **target language** is the language the student is learning or wants to improve.

### Current Status:
- **Primary Target Language:** English (fully supported with 27 lesson templates)
- **Other Languages:** Infrastructure supports all 12 languages, but lesson templates currently only exist for English

### How It Works:
When creating a student profile, tutors select:
1. **Target Language** - Required field
2. The system uses this to:
   - Generate appropriate lesson content
   - Select relevant vocabulary
   - Create contextual examples
   - Personalize learning materials

### Example Use Cases:
- French student learning English → Target: English
- American learning Spanish → Target: Spanish
- German learning Japanese → Target: Japanese

---

## 🏠 Native Language (Student's First Language)

### Definition:
The **native language** is the student's first language or the language they're most comfortable with.

### Current Status:
- **Optional Field** - Can be left unspecified
- **All 12 Languages Supported** as native languages

### How It Works:
The native language is used for:
1. **Translation Assistance** - In-lesson word translation feature
2. **Contextual Understanding** - AI considers native language when generating examples
3. **Cultural Context** - Lessons can reference cultural differences
4. **Vocabulary Explanations** - Can provide translations when needed

### Example Use Cases:
- Spanish speaker learning English → Native: Spanish, Target: English
- French speaker learning German → Native: French, Target: German
- Multilingual student → Can specify primary native language

---

## 📊 Language Combinations

### Most Common Combinations:
Based on the platform structure, any combination is possible:

| Native Language | → | Target Language | Status |
|----------------|---|-----------------|--------|
| Spanish | → | English | ✅ Fully Supported |
| French | → | English | ✅ Fully Supported |
| German | → | English | ✅ Fully Supported |
| Italian | → | English | ✅ Fully Supported |
| Polish | → | English | ✅ Fully Supported |
| Portuguese | → | English | ✅ Fully Supported |
| Russian | → | English | ✅ Fully Supported |
| Chinese | → | English | ✅ Fully Supported |
| Japanese | → | English | ✅ Fully Supported |
| Korean | → | English | ✅ Fully Supported |
| Slovak | → | English | ✅ Fully Supported |

### Other Combinations:
- **English → Spanish** - Infrastructure ready, needs Spanish lesson templates
- **English → French** - Infrastructure ready, needs French lesson templates
- **Any → Any** - Platform supports any combination, needs lesson templates

---

## 🔧 Technical Implementation

### Database Fields:
```sql
students table:
- target_language: string (required) - Language code (e.g., 'en', 'es')
- native_language: string (optional) - Language code or null
```

### Language Codes (ISO 639-1):
- `en` - English
- `es` - Spanish (Español)
- `fr` - French (Français)
- `pl` - Polish (Polski)
- `de` - German (Deutsch)
- `it` - Italian (Italiano)
- `ja` - Japanese (日本語)
- `ko` - Korean (한국어)
- `zh` - Chinese (中文)
- `ru` - Russian (Русский)
- `pt` - Portuguese (Português)
- `sk` - Slovak (Slovenčina)

---

## 🎓 Current Lesson Template Support

### Fully Supported (Target Language):
**English Only** - 27 lesson templates across:
- Grammar (A1-C2)
- Conversation (A1-C1)
- Business English (B1-C1)
- English for Travel (A1-C2)
- English for Kids (A1-B2)
- Pronunciation (A2-B2)

### Native Language Support:
**All 12 Languages** - Used for:
- Translation assistance
- Cultural context
- Personalized examples
- Vocabulary explanations

---

## 🌟 Key Features by Language Role

### Target Language Features:
✅ AI-generated lessons  
✅ Proficiency level tracking (A1-C2)  
✅ Category-specific templates  
✅ Interactive exercises  
✅ Vocabulary building  
✅ Grammar explanations  
✅ Pronunciation practice  
✅ Progress tracking  

### Native Language Features:
✅ In-lesson translation  
✅ Cultural context awareness  
✅ Personalized examples  
✅ Vocabulary explanations  
✅ Learning style adaptation  
✅ Age-appropriate content  

---

## 🚀 Expansion Potential

### Adding New Target Languages:
To add full support for a new target language (e.g., Spanish):

**Requirements:**
1. Create 27 lesson templates (matching English structure)
2. Translate category names and descriptions
3. Add language-specific grammar rules
4. Create cultural context examples
5. Develop pronunciation guides
6. Test AI generation for that language

**Estimated Effort:** 2-3 months per language

### Adding New Native Languages:
To add a new native language:

**Requirements:**
1. Add language to `languages` array in `lib/sample-data.ts`
2. Add language code and flag
3. Test translation feature
4. Verify AI understands the language for context

**Estimated Effort:** 1-2 days per language

---

## 📱 User Interface

### Student Creation Form:
When creating a student, tutors see:

**Target Language Dropdown:**
```
🇬🇧 English
🇪🇸 Spanish
🇫🇷 French
🇵🇱 Polish
🇩🇪 German
🇮🇹 Italian
🇯🇵 Japanese
🇰🇷 Korean
🇨🇳 Chinese
🇷🇺 Russian
🇵🇹 Portuguese
🇸🇰 Slovak
```

**Native Language Dropdown:**
```
Not specified (optional)
🇬🇧 English
🇪🇸 Spanish
🇫🇷 French
... (same 12 languages)
```

---

## 💡 Use Cases

### Scenario 1: Traditional Language Learning
**Student:** Maria from Spain  
**Native Language:** Spanish (es)  
**Target Language:** English (en)  
**Result:** English lessons with Spanish translation support

### Scenario 2: Multilingual Student
**Student:** Pierre from France  
**Native Language:** French (fr)  
**Target Language:** English (en)  
**Result:** English lessons with French cultural context

### Scenario 3: Heritage Language Learning
**Student:** Second-generation immigrant  
**Native Language:** English (en)  
**Target Language:** Polish (pl)  
**Result:** Polish lessons (when templates available) with English support

### Scenario 4: Business Professional
**Student:** German executive  
**Native Language:** German (de)  
**Target Language:** English (en)  
**Result:** Business English lessons with German translation

### Scenario 5: Young Learner
**Student:** 8-year-old from Italy  
**Native Language:** Italian (it)  
**Target Language:** English (en)  
**Result:** English for Kids lessons with Italian support

---

## 🔍 Translation Feature

### How It Works:
1. Student is reading a lesson in their target language
2. They encounter an unfamiliar word
3. They click the translation icon
4. System translates word to their native language
5. Translation appears in a tooltip/popup

### Supported:
- All 12 languages can be translated to/from
- Uses AI-powered translation
- Context-aware translations
- Vocabulary-specific translations

### Example:
- **Target Language:** English
- **Native Language:** Spanish
- **Word in Lesson:** "Entrepreneur"
- **Translation Shown:** "Emprendedor"

---

## 📈 Statistics

### Current Platform:
- **Total Languages:** 12
- **Target Language Templates:** 1 (English only)
- **Native Language Support:** 12 (all languages)
- **Possible Combinations:** 144 (12 × 12)
- **Fully Functional Combinations:** 12 (any native → English)

### Language Distribution (by region):
- **European Languages:** 7 (English, Spanish, French, Polish, German, Italian, Slovak)
- **Asian Languages:** 4 (Japanese, Korean, Chinese, Russian)
- **Portuguese:** 1 (covers Portugal & Brazil)

---

## 🎯 Recommendations

### For Tutors:
1. **Always specify target language** - Required for lesson generation
2. **Include native language when possible** - Improves translation accuracy
3. **Use English as target language** - Only fully supported language currently
4. **Consider cultural context** - Native language helps AI personalize content

### For Students:
1. **Accurate native language** - Better translation support
2. **Clear target language** - Ensures appropriate lesson content
3. **Update as needed** - Can change languages as proficiency grows

---

## 🔮 Future Roadmap

### Phase 1: Current (Complete)
✅ 12 languages for native/target selection  
✅ English lesson templates (27 total)  
✅ Translation feature  
✅ Cultural context awareness  

### Phase 2: Expansion (Planned)
🔄 Spanish lesson templates  
🔄 French lesson templates  
🔄 German lesson templates  
🔄 Additional European languages  

### Phase 3: Global (Future)
📅 Asian language templates (Japanese, Korean, Chinese)  
📅 Additional language pairs  
📅 Multilingual interface  
📅 Advanced translation features  

---

## 📞 Support

For questions about language support:
- **Email:** support@linguaflow.online
- **Feedback:** feedback@linguaflow.online

---

**Last Updated:** February 2, 2026  
**Total Languages:** 12  
**Fully Supported Target Languages:** 1 (English)  
**Supported Native Languages:** 12 (All)  
**Possible Combinations:** 144
