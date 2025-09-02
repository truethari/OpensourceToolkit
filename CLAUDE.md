# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenSource Toolkit is a modern Next.js 15 application providing 32+ developer and utility tools. It's built with React 19, TypeScript, Tailwind CSS, and uses shadcn/ui components with Radix UI primitives.

## Development Commands

### Core Commands

```bash
npm run dev         # Start development server on port 5001 with Turbopack
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm run test        # Run format and lint checks (no unit tests)
```

### Port Configuration

- Development server runs on port 5001 (not 3000)
- Use `--turbopack` flag for faster builds

## Architecture Overview

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (tools)/           # Grouped tool routes
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── tools/             # Tool-specific components
│   ├── general/           # Navigation & layout
│   └── wrappers/          # Layout wrappers
├── config/                # Tool configuration & registry
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── providers/             # React providers
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

### Key Architectural Patterns

#### Tool Registration System

All tools are registered in `src/config/index.ts` with metadata including:

- Basic info (id, title, description)
- UI properties (icon, color, category)
- SEO metadata
- Features list
- Tags for search/filtering

#### Component Patterns

- All tool components use `ToolsWrapper` for consistent layout
- Tools are client-side only ("use client" directive)
- State management with React hooks (useState, useCallback, useMemo)
- Copy-to-clipboard functionality for results
- Loading states and error handling

#### Styling System

- Dark theme by default
- CSS variables for theming (HSL color format)
- Tailwind classes with design system tokens
- Responsive design (mobile-first)
- shadcn/ui component library

## Adding New Tools

### 1. Create Tool Component

```
src/components/tools/your-tool/index.tsx
```

### 2. Create Page Route

```
src/app/(tools)/your-tool/page.tsx
```

### 3. Register Tool

Add entry to `tools` array in `src/config/index.ts` with:

- Unique id (kebab-case)
- Lucide React icon
- Appropriate category
- SEO metadata

### Tool Categories

- Text & Data Generators
- Format Converters
- Security Tools
- Network & Monitoring
- Development & API
- File & Document Tools
- Design & Creative
- Hardware Testing
- Blockchain & Crypto

## Code Standards

### TypeScript

- Strict TypeScript enabled
- Define interfaces for complex objects
- Use proper typing (avoid `any`)
- Path aliases configured (`@/*` maps to `src/*`)

### React Patterns

- Functional components with hooks
- `useCallback` for event handlers
- `useMemo` for expensive calculations
- Client-side processing for privacy

### Styling

- Tailwind CSS utility classes
- CSS variables for theming
- Responsive design patterns
- Dark theme considerations

### Import Organization

1. React imports
2. UI component imports
3. Icon imports (Lucide React)
4. Type definitions
5. Component implementation

## Key Dependencies

### Core Framework

- Next.js 15 with App Router
- React 19
- TypeScript 5

### UI & Styling

- Tailwind CSS with plugins
- shadcn/ui components
- Radix UI primitives
- Lucide React icons
- next-themes for theme management

### Development Tools

- ESLint with Next.js config
- Prettier with Tailwind plugin
- Husky for git hooks
- Turbopack for dev builds

### Utilities

- Zustand for state management
- TanStack Query for data fetching
- Faker.js for mock data
- Various crypto/utility libraries

## Testing Approach

No automated test framework is configured. Testing is manual:

- Functionality testing across browsers
- Responsive design testing
- Edge case and error scenario testing
- Performance testing for large inputs

## Deployment & Build

- Standalone Next.js output for Docker
- Image optimization with WebP/AVIF
- Compression enabled
- SEO optimized with next-sitemap

## Privacy & Security

- All processing happens client-side
- No external API calls for sensitive operations
- No tracking of user inputs
- Secure cryptographic implementations

## Contributing Guidelines

Detailed contribution guidelines are in CONTRIBUTING.md, including:

- Tool development patterns
- Code style requirements
- UI/UX consistency standards
- Pull request process
