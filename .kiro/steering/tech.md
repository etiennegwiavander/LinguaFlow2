# Technology Stack & Development Guide

## Core Technologies

### Frontend Framework
- **Next.js 13.5.1** with App Router
- **React 18.2.0** for UI components
- **TypeScript** for type safety
- **Tailwind CSS 3.3.3** for styling with custom professional theme

### Backend & Database
- **Supabase** for PostgreSQL database, authentication, and Edge Functions
- **Supabase Auth** for user management and JWT tokens
- **Row Level Security (RLS)** policies for data access control

### UI Components & Styling
- **Shadcn UI** component library (`@radix-ui` primitives)
- **Tailwind CSS** with custom color palette (ocean, indigo, emerald themes)
- **Lucide React** for icons
- **Sonner** for toast notifications
- **Next Themes** for dark/light mode support

### Form Management & Validation
- **React Hook Form** for form handling
- **Zod** for schema validation and type inference

### Testing
- **Jest** with Next.js integration
- **React Testing Library** for component testing
- **jsdom** test environment
- Coverage collection from `components/` and `lib/` directories

### Development Tools
- **ESLint** with Next.js config
- **TypeScript** strict mode enabled
- **Autoprefixer** for CSS vendor prefixes

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Database
```bash
supabase migration up    # Apply database migrations
supabase functions deploy # Deploy Edge Functions
```

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

### Optional
- `OPENAI_API_KEY` - For AI image generation (DALL-E)
- `GEMINI_API_KEY` - Alternative AI image generation
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google Calendar integration
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

## Build Configuration

### Next.js Config
- Images unoptimized for static deployment
- SWC minification disabled for build stability
- Webpack fallbacks configured for Node.js modules
- Trailing slash enabled for deployment compatibility

### Deployment
- Optimized for **Netlify** deployment
- Static export compatible
- Edge Functions deployed to Supabase

## Key Libraries

### AI & Content Generation
- Custom AI integration via Supabase Edge Functions
- Image generation with DALL-E/Gemini fallbacks
- Content personalization based on student profiles

### Data Management
- `date-fns` for date manipulation
- `react-markdown` with `remark-gfm` for content rendering
- `jspdf` and `html2canvas` for PDF export

### Performance
- `embla-carousel-react` for carousels
- `react-resizable-panels` for layout
- Custom debouncing and caching utilities