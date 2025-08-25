# LinguaFlow


LinguaFlow is a comprehensive web application designed to empower private language tutors by automating lesson preparation, streamlining student management, and enhancing the overall teaching experience. It leverages AI to provide hyper-personalized content and efficient tools, allowing tutors to focus more on teaching and less on administrative tasks.

## ✨ Features

### 1. Core Application Structure & Technologies

*   **Frontend Framework:** Built with **Next.js** (v13.5.1) and React for a modern, performant user interface.
*   **Backend & Database:** Powered by **Supabase**, providing a robust PostgreSQL database, secure authentication services, and scalable Edge Functions for serverless logic.
*   **Styling:** Utilizes **Tailwind CSS** for a utility-first approach, ensuring a highly customizable and responsive design. Custom themes and components are defined in `tailwind.config.ts` and `app/globals.css`.
*   **UI Components:** Integrates **Shadcn UI** (`components/ui/*`) for a consistent, accessible, and aesthetically pleasing user experience.
*   **Form Management:** Employs `react-hook-form` with `zod` for efficient form handling and robust data validation.
*   **Icons:** Uses `lucide-react` for a comprehensive set of vector icons across the application.
*   **Notifications:** Implements `sonner` for user-friendly and non-intrusive toast notifications.

### 2. User Authentication & Management

*   **Secure Authentication:** Features a complete authentication system (`lib/auth-context.tsx`) handling user sign-up, sign-in, and sign-out processes via Supabase.
*   **Seamless Sessions:** Includes proactive session refreshing and advanced token management (`lib/supabase.ts`, `docs/JWT_EXPIRATION_PREVENTION.md`) to prevent JWT expiration issues, ensuring a smooth and uninterrupted user experience.
*   **Role-Based Access:** Supports distinct user roles (tutor and admin) with tailored functionalities and access controls.
*   **Account Lifecycle:** Provides comprehensive flows for account recovery (`app/auth/recover-account/page.tsx`) and scheduled account deletion (`app/auth/deletion-scheduled/page.tsx`), complete with email notifications and a recovery window.

### 3. Student Management

*   **Detailed Student Profiles:** Tutors can easily create, view, edit, and delete comprehensive student profiles (`app/students/page.tsx`, `app/students/[id]/page.tsx`).
*   **Rich Student Data:** Student profiles (`components/students/StudentForm.tsx`) capture essential information:
    *   Personal details: Name, target language, native language, proficiency level (A1-C2), and age group.
    *   Learning specifics: Detailed learning goals and identified weaknesses (grammar, vocabulary, pronunciation, conversational fluency barriers).
    *   Preferences: Preferred learning styles and additional notes.
*   **Profile Customization:** Supports uploading avatar images for students to personalize their profiles.

### 4. Lesson Planning & AI Generation (Core Feature)

*   **AI Lesson Architect:** A central hub for creating and customizing lessons (`app/students/[id]/page.tsx` - AI Lesson Architect tab).
*   **Hyper-Personalized Lessons:** Leverages AI (via Supabase Edge Functions) to generate highly personalized lesson plans tailored to each student's unique profile and learning needs.
*   **Structured Templates:** Utilizes a library of pre-defined lesson templates (`supabase/migrations/*_lesson_templates.sql`) across various categories (e.g., Grammar, Conversation, Business English, English for Kids, Vocabulary, Pronunciation, Picture Description, English for Travel) and proficiency levels.
*   **Interactive Materials:** Generates interactive lesson content (`components/students/SubTopicSelectionDialog.tsx`) based on selected sub-topics, designed for engaging learning experiences.
*   **Diverse Content Types:** Lessons can incorporate various interactive elements, including enhanced vocabulary sections (`components/lessons/EnhancedVocabularySection.tsx`), dynamic dialogues, interactive exercises, and more.
*   **Lesson History:** Maintains a record of all generated lessons and their associated interactive materials.
*   **Dynamic Lesson Banners:** Automatically generates or fetches visually appealing banner images for lessons (`components/lessons/LessonBannerImage.tsx`), utilizing AI (DALL-E/Gemini) or curated educational images as intelligent fallbacks.

### 5. Calendar Integration

*   **Google Calendar Sync:** Enables tutors to seamlessly connect their Google Calendar (`app/calendar/page.tsx`) to synchronize upcoming lessons and events.
*   **Automated Synchronization:** The system automates event syncing and manages Google Calendar webhook subscriptions (`lib/google-calendar.ts`, `lib/google-calendar-improved.ts`, `supabase/migrations/*_google_tokens.sql`, `supabase/migrations/*_calendar_events.sql`, `supabase/migrations/*_webhook_renewal.sql`).
*   **Dashboard Integration:** Displays upcoming calendar events directly on the tutor's dashboard (`app/dashboard/page.tsx`) for quick overview.

### 6. Discussion Topics (New Feature)

*   **Dedicated Conversation Tab:** A new "Discussion Topics" tab within the student profile (`components/students/DiscussionTopicsTab.tsx`) provides a structured environment for practicing conversational skills.
*   **Flexible Topic Management:** Tutors can choose from a list of pre-generated discussion topics (intelligently filtered by student level) or create their own custom topics (`components/students/TopicsList.tsx`, `components/students/CustomTopicInput.tsx`).
*   **AI-Powered Question Generation:** Upon topic selection, the AI generates a set of personalized discussion questions (minimum 20) tailored to the student's profile, proficiency level, learning goals, and identified weaknesses (`lib/discussion-questions-db.ts`, `lib/discussion-topics-db.ts`, `app/api/supabase/functions/generate-topic-description/route.ts`).
*   **Gamified Flashcard Interface:** Questions are presented in an interactive flashcard format (`components/students/FlashcardInterface.tsx`, `components/students/QuestionCard.tsx`), featuring smooth animations and intuitive navigation controls (`components/students/NavigationControls.tsx`).
*   **Optimized Performance:** Utilizes client-side caching (`lib/discussion-cache.ts`) and advanced performance optimizations (`lib/performance-monitor.ts`) to ensure a highly responsive and fluid user experience.

### 7. Utilities & Enhancements

*   **Material Export:** Tutors can easily export generated lesson materials to both PDF and Microsoft Word formats (`lib/export-utils.ts`, `lib/improved-export-utils.ts`).
*   **In-Lesson Translation:** A floating toggle (`components/lessons/FloatingTranslationToggle.tsx`) provides instant translation of words directly within the lesson content (`components/lessons/WordTranslationPopup.tsx`).
*   **Dynamic Dialogue Avatars:** Enhances dialogue sections with visual character avatars (`components/lessons/DialogueAvatar.tsx`), intelligently using tutor profile images or AI-generated avatars based on character roles.
*   **Progress Tracking:** Implements a system to track student progress within interactive lessons (`lib/progress-context.tsx`).
*   **Robust Error Handling:** Features comprehensive error boundaries (`components/students/ErrorBoundary.tsx`), specific error fallbacks (`components/students/ErrorFallbacks.tsx`), and various loading/skeleton states (`components/students/LoadingStates.tsx`, `components/students/SkeletonLoaders.tsx`) for a resilient and user-friendly experience.

### 8. Admin Portal

*   **System Dashboard:** Provides administrators with an overview of key system statistics, including total tutors, students, lessons, and overall system health (`app/admin-portal/dashboard/page.tsx`).
*   **User Management:** Enables administrators to manage tutor accounts, perform actions such as changing status, toggling admin privileges, resetting passwords, and initiating account deletions (`app/admin-portal/tutors/page.tsx`).
*   **Monitoring & Configuration:** Displays simulated system logs (`app/admin-portal/logs/page.tsx`) and allows for configuration of system-wide settings (`app/admin-portal/settings/page.tsx`).

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm (or yarn/pnpm)
*   Git
*   A Supabase project (with database and API keys configured)
*   Google API credentials for Calendar integration (optional, but recommended for full functionality)
*   OpenAI or Gemini API keys for AI image generation (optional, fallback images will be used otherwise)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd linguaflow
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Supabase environment variables:**
    Create a `.env.local` file in the root directory and add your Supabase and API keys:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

    # Optional: AI Image Generation
    OPENAI_API_KEY=your_openai_api_key_for_dalle
    GEMINI_API_KEY=your_gemini_api_key

    # Optional: Google Calendar Integration
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```
4.  **Run Supabase migrations (if setting up a new project):**
    Navigate to your Supabase project's `supabase` directory and run:
    ```bash
    supabase migration up
    ```
    *(Note: Ensure your local Supabase CLI is configured and connected to your project.)*
5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

## 🌐 Deployment

This application is designed for deployment on platforms like **Netlify** or **Vercel** due to its Next.js framework. Supabase Edge Functions handle the serverless backend logic.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**LinguaFlow** - *Empowering Tutors, Personalizing Learning.*
