# CodeWeft

A comprehensive personal productivity and development workspace built with React, TypeScript, and Supabase.

## Features

### Knowledge Management
- **Notes** - Rich text editor with block-based editing, backlinks, and graph view
- **Flashcards** - Spaced repetition system for effective learning
- **Research Papers** - Track and organize academic papers with metadata extraction
- **ML Notes** - Specialized notebook for machine learning experiments

### Task & Project Management
- **Tasks** - Kanban board with drag-and-drop, priorities, and due dates
- **Projects** - Track personal projects with GitHub integration
- **Courses** - Course progress tracking with assignments
- **Habits** - Habit tracker with streaks and analytics

### Development Tools
- **GitHub Integration** - Repository management, file editing, gists, actions
- **DSA Problems** - Track LeetCode-style problems with solution management
- **Code Playground** - In-browser code execution
- **API Client** - Test and document APIs

### Utilities
- **Pomodoro Timer** - Focus timer with analytics
- **Whiteboard** - Digital canvas for brainstorming
- **Regex Lab** - Test and learn regular expressions
- **Theme Forge** - Custom theme creator

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Storage**: IndexedDB (Dexie), Supabase Storage
- **Build Tool**: Vite
- **Testing**: Vitest

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- GitHub account (for GitHub features)
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-personal-space-main
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

### Supabase Setup

1. Create a new project at https://supabase.com
2. Run the database migrations (see `/supabase/migrations`)
3. Set up authentication providers (Email, GitHub OAuth)
4. Configure Row Level Security (RLS) policies
5. Enable Real-time for tables that need live updates

### Database Schema

The app uses the following main tables:
- `pages` - Notes and documents
- `tasks` - Todo items
- `courses` - Course information
- `dsa_problems` - Coding problems
- `resources` - Bookmarks and links
- `flashcards` - Study cards
- `habits` - Habit tracking
- `papers` - Research papers
- `github_settings` - GitHub OAuth tokens

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Project Structure

```
src/
├── components/      # React components
│   ├── ui/         # shadcn/ui components
│   ├── layout/     # Layout components
│   ├── editor/     # Block editor
│   └── github/     # GitHub-related components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── pages/          # Page components
├── services/       # API services
├── types/          # TypeScript types
└── integrations/   # Supabase client
```

### Key Components

- **BlockEditor** - Rich text editor with block-based editing
- **CommandPalette** - Global search and navigation
- **AppLayout** - Main application layout with sidebar
- **ErrorBoundary** - Error handling for the entire app

### Authentication

The app uses Supabase Auth with the following providers:
- Email/Password
- GitHub OAuth

Protected routes are wrapped with the `ProtectedRoute` component.

### State Management

- **TanStack Query** - Server state (API calls, caching)
- **React Context** - Global UI state (theme, focus mode)
- **Local Storage** - User preferences

### Security

- Input sanitization with DOMPurify
- XSS prevention
- CSRF protection via Supabase
- Row Level Security on database
- Rate limiting for GitHub API

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
Make sure to set these in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Functions
Deploy edge functions:
```bash
supabase functions deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For support, email support@codeweft.com or join our Discord community.
