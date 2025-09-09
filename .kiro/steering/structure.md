# Project Structure & Organization

## Root Directory Structure

```
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── lib/                    # Utility functions and services
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── supabase/              # Database migrations and Edge Functions
├── public/                # Static assets
├── docs/                  # Project documentation
├── scripts/               # Utility scripts for testing and deployment
├── __tests__/             # Test files and test utilities
└── dev-data/              # Development data and SQL scripts
```

## App Directory (Next.js App Router)

### Page Routes
- `app/page.tsx` - Landing page
- `app/dashboard/` - Tutor dashboard
- `app/students/` - Student management
- `app/calendar/` - Google Calendar integration
- `app/settings/` - User settings
- `app/admin-portal/` - Admin interface

### Authentication Routes
- `app/auth/login/` - User login
- `app/auth/signup/` - User registration
- `app/auth/reset-password/` - Password reset flow
- `app/auth/forgot-password/` - Password recovery

### API Routes
- `app/api/admin/` - Admin-only endpoints
- `app/api/auth/` - Authentication endpoints
- `app/api/supabase/functions/` - Supabase Edge Function proxies
- `app/api/generate-*` - AI content generation endpoints

## Components Organization

### Domain-Specific Components
- `components/admin/` - Admin portal components
- `components/auth/` - Authentication forms and flows
- `components/dashboard/` - Dashboard widgets and cards
- `components/students/` - Student management interfaces
- `components/lessons/` - Lesson display and interaction
- `components/settings/` - Settings and preferences

### Layout Components
- `components/layout/` - Header, Sidebar, navigation
- `components/landing/` - Landing page sections
- `components/main-layout.tsx` - Main app layout wrapper

### UI Components
- `components/ui/` - Shadcn UI components (buttons, dialogs, forms, etc.)
- `components/theme-provider.tsx` - Theme context provider

## Library Organization

### Core Services
- `lib/supabase.ts` - Supabase client configuration
- `lib/auth-context.tsx` - Authentication context and hooks
- `lib/utils.ts` - Common utility functions

### Feature-Specific Services
- `lib/discussion-*.ts` - Discussion topics and questions
- `lib/vocabulary-*.ts` - Vocabulary flashcard system
- `lib/email-*.ts` - Email management and templates
- `lib/google-calendar*.ts` - Calendar integration
- `lib/password-reset-*.ts` - Password reset functionality

### Data and Utilities
- `lib/mock-data/` - Mock data for development and testing
- `lib/export-utils.ts` - PDF/Word export functionality
- `lib/performance-monitor.ts` - Performance tracking

## Database Structure (Supabase)

### Migrations
- `supabase/migrations/` - SQL migration files with timestamps
- Naming: `YYYYMMDDHHMMSS_description.sql`

### Edge Functions
- `supabase/functions/` - Serverless functions for AI generation
- `generate-discussion-questions/` - Discussion question generation
- `generate-vocabulary-words/` - Vocabulary generation
- `send-*-email/` - Email sending functions

## Testing Structure

### Test Organization
- `__tests__/api/` - API route tests
- `__tests__/components/` - Component unit tests
- `__tests__/lib/` - Library function tests
- `__tests__/integration/` - Integration tests
- `__tests__/performance/` - Performance tests
- `__tests__/security/` - Security tests

### Test Utilities
- `__tests__/mocks/` - Mock implementations
- `__tests__/utils/` - Test helper functions
- `jest.setup.js` - Global test configuration

## File Naming Conventions

### Components
- PascalCase for component files: `StudentForm.tsx`
- Kebab-case for CSS files: `vocabulary-accessibility.css`
- Test files: `ComponentName.test.tsx`

### API Routes
- Kebab-case for route segments: `reset-password`
- `route.ts` for API handlers
- `page.tsx` for page components

### Database
- Snake_case for table and column names
- Timestamp prefixes for migrations
- Descriptive migration names

## Import Path Aliases

```typescript
"@/*": ["./*"]           # Root-relative imports
"@/components/*"         # Components directory
"@/lib/*"               # Library functions
"@/hooks/*"             # Custom hooks
"@/types/*"             # Type definitions
```

## Key Architectural Patterns

### Component Structure
- Error boundaries for robust error handling
- Loading states and skeleton loaders
- Responsive design with Tailwind CSS
- Accessibility compliance

### Data Flow
- Supabase for data persistence
- React Context for global state
- Custom hooks for data fetching
- Client-side caching for performance

### Security
- Row Level Security (RLS) policies
- JWT token management with auto-refresh
- Admin middleware for protected routes
- Input validation with Zod schemas