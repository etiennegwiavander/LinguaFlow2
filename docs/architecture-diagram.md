# LinguaFlow Architecture Diagram

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Tutor Web     │  │   Student Web   │  │   Admin Web     │                  │
│  │   Interface     │  │   Interface     │  │   Portal        │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • Dashboard     │  │ • Shared        │  │ • User Mgmt     │                  │
│  │ • Students      │  │   Lessons       │  │ • Email Config  │                  │
│  │ • Lessons       │  │ • Flashcards    │  │ • Analytics     │                  │
│  │ • Calendar      │  │ • Vocabulary    │  │ • System Logs   │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           Next.js 13 App Router                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Frontend      │  │   API Routes    │  │   Middleware    │                  │
│  │   Components    │  │                 │  │                 │                  │
│  │                 │  │ • Auth Routes   │  │ • Auth Guard    │                  │
│  │ • React/TSX     │  │ • Admin APIs    │  │ • JWT Refresh   │                  │
│  │ • Tailwind CSS  │  │ • AI Proxies    │  │ • RLS Policies  │                  │
│  │ • Shadcn UI     │  │ • File Export   │  │ • Error Handler │                  │
│  │ • State Mgmt    │  │ • Email APIs    │  │                 │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               BACKEND LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              Supabase Platform                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   PostgreSQL    │  │   Edge          │  │   Auth          │                  │
│  │   Database      │  │   Functions     │  │   Service       │                  │
│  │                 │  │                 │  │                 │                  │
│  │ • Tables        │  │ • AI Generation │  │ • JWT Tokens    │                  │
│  │ • RLS Policies  │  │ • Email Sending │  │ • OAuth         │                  │
│  │ • Migrations    │  │ • Webhooks      │  │ • Session Mgmt  │                  │
│  │ • Triggers      │  │ • Cron Jobs     │  │ • Password Reset│                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ External APIs
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   AI Services   │  │   Google APIs   │  │   Email         │                  │
│  │                 │  │                 │  │   Services      │                  │
│  │ • OpenAI/GPT    │  │ • Calendar API  │  │                 │                  │
│  │ • Gemini AI     │  │ • OAuth 2.0     │  │ • SMTP Config   │                  │
│  │ • DALL-E        │  │ • Drive API     │  │ • Nodemailer    │                  │
│  │ • Content Gen   │  │                 │  │ • Templates     │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Architecture

### Frontend Architecture (Next.js App Router)

```
app/
├── (auth)/                    # Authentication routes
│   ├── login/
│   ├── signup/
│   ├── reset-password/
│   └── forgot-password/
├── dashboard/                 # Tutor dashboard
├── students/                  # Student management
│   └── [id]/                 # Individual student pages
├── admin-portal/             # Admin interface
│   ├── dashboard/
│   ├── tutors/
│   ├── email/
│   └── settings/
├── api/                      # API routes
│   ├── auth/
│   ├── admin/
│   ├── supabase/functions/
│   └── generate-*/
└── shared-lesson/[id]/       # Public lesson sharing

components/
├── ui/                       # Shadcn UI components
├── layout/                   # Header, Sidebar, Navigation
├── students/                 # Student-specific components
├── lessons/                  # Lesson display components
├── admin/                    # Admin portal components
└── auth/                     # Authentication components

lib/
├── supabase.ts              # Database client
├── auth-context.tsx         # Authentication state
├── discussion-*.ts          # Discussion features
├── vocabulary-*.ts          # Vocabulary system
├── email-*.ts              # Email management
└── utils.ts                # Utility functions
```

### Database Schema (Supabase PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE TABLES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   tutors    │    │  students   │    │   lessons   │          │
│  │             │    │             │    │             │          │
│  │ • id (PK)   │◄──┐│ • id (PK)   │◄──┐│ • id (PK)   │          │
│  │ • email     │   ││ • name      │   ││ • date      │          │
│  │ • name      │   ││ • level     │   ││ • status    │          │
│  │ • is_admin  │   ││ • tutor_id  │───┘│ • student_id│────────┘ │
│  └─────────────┘   │└─────────────┘    │ • materials │          │
│                    │                   └─────────────┘          │
│  ┌─────────────┐   │ ┌─────────────┐    ┌─────────────┐         │
│  │discussion_  │   │ │vocabulary_  │    │   email_    │         │
│  │topics       │   │ │sessions     │    │   templates │         │
│  │             │   │ │             │    │             │         │
│  │ • id (PK)   │   │ │ • id (PK)   │    │ • id (PK)   │         │
│  │ • title     │   │ │ • words     │    │ • name      │         │
│  │ • level     │   │ │ • position  │    │ • content   │         │
│  │ • student_id│───┘ │ • student_id│────┘│ • type      │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │google_      │     │calendar_    │     │shared_      │        │
│  │tokens       │     │events       │     │lessons      │        │
│  │             │     │             │     │             │        │
│  │ • tutor_id  │─────│ • tutor_id  │     │ • lesson_id │        │
│  │ • access_   │     │ • event_id  │     │ • expires_at│        │
│  │   token     │     │ • summary   │     │ • is_active │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action                                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    Authentication     ┌─────────────┐          │
│  │   React     │◄──────────────────────│   Auth      │          │
│  │ Component   │                       │ Context     │          │
│  └─────────────┘                       └─────────────┘          │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    API Request        ┌─────────────┐          │
│  │   Custom    │──────────────────────►│   Next.js   │          │
│  │   Hook      │                       │ API Route   │          │
│  └─────────────┘                       └─────────────┘          │
│       │                                       │                 │
│       │                                       ▼                 │
│       │                              ┌─────────────┐            │
│       │                              │  Supabase   │            │
│       │                              │  Client     │            │
│       │                              └─────────────┘            │
│       │                                       │                 │
│       │                                       ▼                 │
│       │                              ┌─────────────┐            │
│       │                              │ PostgreSQL  │            │
│       │                              │ Database    │            │
│       │                              └─────────────┘            │
│       │                                       │                 │
│       │                                       ▼                 │
│       │                              ┌─────────────┐            │
│       │                              │   Edge      │            │
│       │                              │ Functions   │            │
│       │                              └─────────────┘            │
│       │                                       │                 │
│       │                                       ▼                 │
│       │                              ┌─────────────┐            │
│       │                              │ External    │            │
│       │                              │ AI APIs     │            │
│       │                              └─────────────┘            │
│       │                                       │                 │
│       │◄──────────────────────────────────────┘                 │
│       ▼                                                         │
│  ┌─────────────┐                                                │
│  │   UI        │                                                │
│  │  Update     │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   CLIENT SECURITY                           ││
│  │ • HTTPS Only                                                ││
│  │ • JWT Token Storage                                         ││
│  │ • Auto Token Refresh                                        ││
│  │ • Input Validation (Zod)                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                APPLICATION SECURITY                         ││
│  │ • Auth Middleware                                           ││
│  │ • Route Protection                                          ││
│  │ • Admin Role Checks                                         ││
│  │ • CSRF Protection                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  DATABASE SECURITY                          ││
│  │ • Row Level Security (RLS)                                  ││
│  │ • User-based Data Isolation                                 ││
│  │ • Encrypted Connections                                     ││
│  │ • Audit Logging                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   API SECURITY                              ││
│  │ • Rate Limiting                                             ││
│  │ • API Key Management                                        ││
│  │ • Request Validation                                        ││
│  │ • Error Sanitization                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │    Netlify      │  ◄── Git Push Triggers                     │
│  │   (Frontend)    │                                            │
│  │                 │  • Static Site Generation                  │
│  │ • Next.js Build │  • CDN Distribution                        │
│  │ • Static Assets │  • SSL Certificates                        │
│  │ • Edge Functions│  • Custom Domains                          │
│  └─────────────────┘                                            │
│           │                                                     │
│           │ API Calls                                           │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │    Supabase     │                                            │
│  │   (Backend)     │                                            │
│  │                 │  • Managed PostgreSQL                      │
│  │ • Database      │  • Authentication Service                  │
│  │ • Auth Service  │  • Edge Functions Runtime                  │
│  │ • Edge Functions│  • Real-time Subscriptions                 │
│  │ • File Storage  │  • Automatic Backups                       │
│  └─────────────────┘                                            │
│           │                                                     │
│           │ External API Calls                                  │
│           ▼                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   OpenAI/       │  │   Google        │  │   Email         │  │
│  │   Gemini        │  │   Services      │  │   Providers     │  │
│  │                 │  │                 │  │                 │  │
│  │ • GPT Models    │  │ • Calendar API  │  │ • SMTP Servers  │  │
│  │ • Image Gen     │  │ • OAuth 2.0     │  │ • Templates     │  │
│  │ • Content AI    │  │ • Drive API     │  │ • Delivery      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. **Frontend Architecture**
- **Next.js App Router**: Modern routing with server components
- **Component-based**: Modular, reusable UI components
- **TypeScript**: Type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom theme

### 2. **Backend Architecture**
- **Supabase**: Managed PostgreSQL with built-in auth
- **Edge Functions**: Serverless functions for AI integration
- **Row Level Security**: Database-level access control
- **Real-time**: WebSocket connections for live updates

### 3. **State Management**
- **React Context**: Global state for auth and themes
- **Custom Hooks**: Encapsulated data fetching logic
- **Client-side Caching**: Performance optimization
- **Local Storage**: Session persistence

### 4. **Security Model**
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Tutor/Admin permission levels
- **Data Isolation**: Users can only access their data
- **Input Validation**: Zod schemas for type safety

### 5. **Performance Optimizations**
- **Static Generation**: Pre-built pages where possible
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Next.js image optimization
- **Caching Strategies**: Client and server-side caching

This architecture provides a scalable, secure, and maintainable foundation for the LinguaFlow language tutoring platform.