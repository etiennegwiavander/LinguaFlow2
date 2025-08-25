# Lingua Flow



# LinguaFlow is a comprehensive web application built with Next.js and Supabase, designed to empower private language tutors by automating lesson preparation, streamlining student management, and enhancing the overall teaching experience.

Here's a detailed breakdown of its capabilities:

# 1. Core Application Structure & Technologies
Frontend Framework: Built with Next.js (version 13.5.1), leveraging React for UI development.
Backend & Database: Utilizes Supabase as its primary backend, providing a PostgreSQL database, authentication services, and Edge Functions for serverless logic.
Styling: Employs Tailwind CSS for utility-first styling, with custom themes and components defined in tailwind.config.ts and app/globals.css.
UI Components: Uses a rich set of pre-built UI components from Shadcn UI (components/ui/*), ensuring a consistent and modern look and feel.
Form Management: Integrates react-hook-form with zod for robust form validation and submission.
Icons: Uses lucide-react for a wide range of vector icons.
Notifications: Implements sonner for user-friendly toast notifications.

# 2. User Authentication & Management
Authentication System: Managed by lib/auth-context.tsx, which provides AuthProvider and useAuth hooks. It handles user sign-up, sign-in, and sign-out processes securely through Supabase.
Session Management: Includes proactive session refreshing and token management (lib/supabase.ts, docs/JWT_EXPIRATION_PREVENTION.md) to prevent JWT expiration errors, ensuring a smooth, uninterrupted user experience.
User Roles: Supports different user roles, primarily "tutor" and "admin," with specific functionalities and access controls.
Account Recovery & Deletion: Provides flows for account recovery (app/auth/recover-account/page.tsx) and scheduled account deletion (app/auth/deletion-scheduled/page.tsx), including email notifications and a recovery window.

# 3. Student Management
Student Profiles: Tutors can create, view, edit, and delete detailed student profiles (app/students/page.tsx, app/students/[id]/page.tsx).
Comprehensive Student Data: Student profiles (components/students/StudentForm.tsx) capture extensive information, including:
Name, target language, native language, proficiency level (A1-C2), and age group.
Specific learning goals and detailed weaknesses (grammar, vocabulary, pronunciation, conversational fluency barriers).
Preferred learning styles and additional notes.
Profile Customization: Tutors can upload avatar images for students.

# 4. Lesson Planning & AI Generation (Core Feature)
AI Lesson Architect: The central hub for lesson creation (app/students/[id]/page.tsx - AI Lesson Architect tab).
Personalized Lesson Generation: Leverages AI (likely through Supabase Edge Functions, inferred from test-lesson-generation.js and supabase/migrations/*_lessons.sql) to generate highly personalized lesson plans.
Structured Templates: Utilizes pre-defined lesson templates (supabase/migrations/*_lesson_templates.sql) for various categories (Grammar, Conversation, Business English, English for Kids, Vocabulary, Pronunciation, Picture Description, English for Travel) and proficiency levels. These templates guide the AI in structuring the lesson content.
Interactive Material: Generates interactive lesson content (components/students/SubTopicSelectionDialog.tsx) based on selected sub-topics, which are derived from the student's profile and learning needs.
Content Types: Lessons can include various interactive elements like vocabulary sections (components/lessons/EnhancedVocabularySection.tsx), dialogues, exercises, and more.
Lesson History: Tracks generated lessons and their associated interactive materials.
Lesson Banners: Dynamically generates or fetches visually appealing banner images for lessons (components/lessons/LessonBannerImage.tsx), using AI (DALL-E/Gemini) or curated educational images as fallbacks.

# 5. Calendar Integration
Google Calendar Sync: Allows tutors to connect their Google Calendar (app/calendar/page.tsx) to sync upcoming lessons and events.
Automated Syncing: The system can automatically sync events and manage webhook subscriptions (lib/google-calendar.ts, lib/google-calendar-improved.ts, supabase/migrations/*_google_tokens.sql, supabase/migrations/*_calendar_events.sql, supabase/migrations/*_webhook_renewal.sql).
Dashboard Integration: Upcoming calendar events are displayed on the tutor's dashboard (app/dashboard/page.tsx).
# 6. Discussion Topics (New Feature)
Dedicated Tab: A new "Discussion Topics" tab within the student profile (components/students/DiscussionTopicsTab.tsx) provides a structured way to practice conversational skills.
Topic Management: Tutors can view a list of pre-generated discussion topics (filtered by student level) or create custom topics (components/students/TopicsList.tsx, components/students/CustomTopicInput.tsx).
AI-Powered Question Generation: When a topic is selected, the system generates a set of personalized discussion questions (at least 20) using AI, tailored to the student's profile, level, goals, and weaknesses (lib/discussion-questions-db.ts, lib/discussion-topics-db.ts, app/api/supabase/functions/generate-topic-description/route.ts).
Gamified Flashcard Interface: Questions are presented in an interactive flashcard format (components/students/FlashcardInterface.tsx, components/students/QuestionCard.tsx), with smooth animations and navigation controls (components/students/NavigationControls.tsx).
Performance & Caching: Implements client-side caching (lib/discussion-cache.ts) and performance optimizations (lib/performance-monitor.ts) for a responsive experience.

# 7. Utilities & Enhancements
Export Functionality: Tutors can export lesson materials to PDF and Word formats (lib/export-utils.ts, lib/improved-export-utils.ts).
In-Lesson Translation: A floating toggle (components/lessons/FloatingTranslationToggle.tsx) allows for instant translation of words within lesson content (components/lessons/WordTranslationPopup.tsx).
Dialogue Avatars: Enhances dialogue sections with visual character avatars (components/lessons/DialogueAvatar.tsx), using tutor profile images or AI-generated avatars based on character roles.
Progress Tracking: Tracks student progress within interactive lessons (lib/progress-context.tsx).
Error Handling & Loading States: Implements robust error boundaries (components/students/ErrorBoundary.tsx), specific error fallbacks (components/students/ErrorFallbacks.tsx), and various loading/skeleton states (components/students/LoadingStates.tsx, components/students/SkeletonLoaders.tsx) for a resilient user experience.

# 8. Admin Portal
Dashboard: Provides an overview of system statistics (total tutors, students, lessons, system health) (app/admin-portal/dashboard/page.tsx).
User Management: Allows administrators to manage tutor accounts, including status changes, admin privilege toggling, password resets, and deletion (app/admin-portal/tutors/page.tsx).
System Monitoring: Displays simulated system logs (app/admin-portal/logs/page.tsx) and allows configuration of system-wide settings (app/admin-portal/settings/page.tsx).

In essence, LinguaFlow is a sophisticated platform that leverages AI to automate and personalize the language tutoring process, providing tutors with powerful tools for content creation, student management, and scheduling, all within a user-friendly and performant interface.
