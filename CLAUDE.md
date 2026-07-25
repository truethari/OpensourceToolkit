# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenSource Toolkit is a modern Next.js 15 application providing 48+ developer and utility tools. It's built with React 19, TypeScript, Tailwind CSS, and uses shadcn/ui components with Radix UI primitives.

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

This section provides a comprehensive guide for adding new tools to the toolkit. Follow these steps carefully to ensure consistency and proper integration.

### Step-by-Step Guide

#### 1. Create Tool Component

Create a new directory and component file:

```
src/components/tools/your-tool-name/index.tsx
```

**Component Structure Requirements:**

```typescript
"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";
import { IconName } from "lucide-react";

// UI Components
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function YourToolName() {
  // State management
  const [input, setInput] = useState("");

  // Memoized calculations
  const result = useMemo(() => {
    // Expensive calculations here
    return processInput(input);
  }, [input]);

  // Event handlers with useCallback
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  return (
    <ToolsWrapper>
      {/* Header section */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <IconName className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          Tool Title
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Tool description
        </p>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input fields */}
            </CardContent>
          </Card>
        </div>

        {/* Results section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              {/* Tab content */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ToolsWrapper>
  );
}
```

**Key Component Patterns:**

- Always use `"use client"` directive at the top
- Wrap everything in `<ToolsWrapper>`
- Use consistent header structure with icon, title, and description
- Use `toast` from "sonner" for notifications
- Implement `copyToClipboard` function for copy functionality
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Follow the grid layout pattern (lg:grid-cols-3 for sidebar + main content)

#### 2. Create Page Route

Create a new page file:

```
src/app/(tools)/your-tool-name/page.tsx
```

**Page Template:**

```typescript
import YourToolName from "@/components/tools/your-tool-name";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("your-tool-name"),
  description: getDescription("your-tool-name"),
  keywords: getKeywords("your-tool-name"),
  openGraph: {
    title: getTitle("your-tool-name"),
    description: getDescription("your-tool-name"),
    type: "website",
    url: getHref("your-tool-name"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Your Tool Name - Brief Description",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("your-tool-name"),
    description: getDescription("your-tool-name"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <YourToolName />;
}
```

**Important Notes:**

- Use the same `id` (kebab-case) in all three places: folder name, component import, and config
- The SEO helper functions automatically pull from the config registration
- OpenGraph and Twitter card metadata are required for social sharing

#### 3. Register Tool in Config

Add your tool to the `tools` array in `src/config/index.ts`:

**First, import the icon (if not already imported):**

```typescript
import { YourIcon } from "lucide-react";
```

**Then add the tool entry:**

```typescript
{
  id: "your-tool-name",              // Must match folder/route name
  title: "Your Tool Name",           // Display name
  shortTitle: "Short Name",          // Used in compact views
  description: "Brief description of what the tool does and its main features",
  icon: YourIcon,                    // Lucide React icon
  color: "bg-blue-500",              // Tailwind color class
  category: "Appropriate Category",  // See categories below
  tags: [                            // Search/filter tags
    "tag1",
    "tag2",
    "keyword1",
    "keyword2",
  ],
  features: [                        // List of key features (4-10 items)
    "Feature 1 Description",
    "Feature 2 Description",
    "Feature 3 Description",
    "Feature 4 Description",
  ],
  popular: false,                    // Set to true for featured tools
  href: "/your-tool-name",          // Must match route
  seo: {
    title: "SEO Title - 50-60 characters ideal",
    description: "SEO description - 150-160 characters ideal. Include key features and benefits.",
    keywords: "comma, separated, keywords, for, seo, search, optimization",
  },
}
```

**Available Tool Categories:**

- `Text & Data Generators` - UUID, Lorem Ipsum, Mock Data, etc.
- `Format Converters` - Base64, Image Converter, Text Case, etc.
- `Security Tools` - JWT, Password Generator, Hash Generator, etc.
- `Network & Monitoring` - IP Location, DNS Lookup, Speed Test, etc.
- `Development & API` - API Tester, Regex Tester, SQL Formatter, etc.
- `File & Document Tools` - PDF Toolkit, Folder Analyzer, VCF Reader, etc.
- `Design & Creative` - Colors Toolkit, ASCII Generator, QR Code, etc.
- `Hardware Testing` - Keyboard Tester, Camera/Mic Tester, Speaker Tester, etc.
- `Blockchain & Crypto` - ETH Converter, EVM Vanity, Blockchain Balance, etc.
- `Health & Fitness` - BMI Calculator, etc.
- `Internet & Web Tools` - Advanced Search Builder, etc.

> Keep this list in sync with the `category` values actually used in
> `src/config/index.ts`. Adding a brand-new category creates a new filter group
> on the homepage, so reuse an existing one unless the tool genuinely doesn't fit.

**Icon Selection Tips:**

- Browse available icons at [Lucide Icons](https://lucide.dev/icons)
- Choose icons that clearly represent the tool's function
- Common choices: `Calculator`, `Hash`, `Code`, `Shield`, `Network`, `Activity`, `Database`

**Color Palette (Tailwind classes):**

- Blue: `bg-blue-500`, `bg-blue-600`
- Green: `bg-green-500`, `bg-emerald-500`
- Red: `bg-red-500`, `bg-red-600`
- Purple: `bg-purple-500`, `bg-violet-500`
- Orange: `bg-orange-500`, `bg-amber-500`
- Others: `bg-cyan-500`, `bg-indigo-500`, `bg-pink-500`, `bg-teal-500`

#### 4. Multi-file Tools

Small tools live in a single `index.tsx`. When a tool grows past roughly 500
lines, split it inside its own folder rather than adding files elsewhere:

```
src/components/tools/your-tool-name/
├── index.tsx          # Main component (state, layout, tabs)
├── SubComponent.tsx   # Large self-contained pieces of UI
├── utils.ts           # Pure logic — no React, easy to test standalone
└── data.ts            # Static lookup tables / presets
```

Keeping pure logic in a separate `utils.ts` matters: it can be exercised
directly with `npx tsx` (see "Verifying Logic" below) without rendering React.

### Testing Checklist

After adding your tool, verify:

- [ ] Component renders without errors (`npm run dev`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Tool appears in homepage grid
- [ ] Tool is searchable via tags
- [ ] Tool is filterable by category
- [ ] Copy to clipboard functionality works
- [ ] Export functionality works (if applicable)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] No horizontal page scroll at 375px (wide tables scroll in their own container)
- [ ] Dark mode styling looks correct
- [ ] All inputs have proper validation
- [ ] Error states are handled gracefully
- [ ] Success/error toasts appear correctly
- [ ] SEO metadata is correct (check page source)
- [ ] Tool route is accessible at `/your-tool-name`
- [ ] No hydration mismatch warnings in the browser console

### Verifying Logic Without a Test Framework

The repo has no test runner, but `tsx` ships with the toolchain and pure logic
in a `utils.ts` can be verified directly before wiring up any UI:

```bash
npx tsx ./scratch-test.mts
```

Two gotchas: `tsconfig.json` targets **ES2017** (so BigInt literals like `1n`
will not compile), and ESM-only dependencies must be imported from a `.mts`
file. Write assertions for known-correct values, run them, then delete the
scratch file — this catches logic bugs far faster than clicking through the UI.

### Avoiding Hydration Mismatches

Tools that render time, randomness, or anything read from `localStorage` /
`Intl` produce different output on the server than in the browser, which throws
a hydration error. Gate that rendering behind a mount flag:

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) {
  return <ToolsWrapper>{/* skeleton or spinner */}</ToolsWrapper>;
}
```

### Mobile Responsiveness

`ToolsWrapper` handles page padding, but each tool must keep its own content
from forcing the page sideways:

- Wrap wide tables in `<div className="overflow-x-auto">` and put `min-w-[Nrem]`
  on the `<table>` — the table then scrolls inside its own box.
- Scale headings with breakpoints: `text-3xl sm:text-4xl`.
- Stack the sidebar/content grid with `grid gap-6 lg:grid-cols-3`.
- Hide button labels on small screens (`<span className="hidden sm:inline">`)
  while keeping the icon visible.
- Use `truncate` / `min-w-0` on flex children so long names don't blow out a row.

### Common Patterns & Best Practices

**State Management:**

```typescript
// Use separate state for each input
const [input1, setInput1] = useState("");
const [input2, setInput2] = useState(0);

// Use useMemo for derived state/calculations
const result = useMemo(() => {
  return expensiveCalculation(input1, input2);
}, [input1, input2]);
```

**Copy to Clipboard:**

```typescript
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to copy to clipboard");
  }
};
```

**Export Results:**

```typescript
const exportResults = () => {
  const data = {
    input: yourInput,
    result: yourResult,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tool-results-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Results exported successfully");
};
```

**Input Validation:**

```typescript
const validateInput = useCallback((value: string): boolean => {
  if (!value || value.trim() === "") {
    toast.error("Input cannot be empty");
    return false;
  }
  // Add specific validation logic
  return true;
}, []);
```

### Common Pitfalls to Avoid

1. **Missing "use client" directive** - All tool components must be client-side
2. **Inconsistent naming** - Use same kebab-case id everywhere
3. **Missing ToolsWrapper** - Always wrap in `<ToolsWrapper>`
4. **Incorrect import paths** - Use `@/` prefix for all imports
5. **Poor mobile responsiveness** - Test on various screen sizes
6. **Missing error handling** - Always handle edge cases and errors
7. **Hardcoded colors** - Use Tailwind classes and CSS variables
8. **Missing toast notifications** - Provide user feedback for actions
9. **No loading states** - Show loading indicators for async operations
10. **Missing TypeScript types** - Define interfaces for complex data

### Example: Complete Tool Implementation

See the BMI Calculator implementation as a reference:

- Component: `src/components/tools/bmi-calculator/index.tsx`
- Page: `src/app/(tools)/bmi-calculator/page.tsx`
- Config: Entry in `src/config/index.ts` (search for "bmi-calculator")

This example demonstrates:

- Multiple input types (metric/imperial units)
- Complex calculations with multiple results
- Tabbed interface for organizing features
- History tracking
- Export functionality
- Visual data representation (gauges, colored badges)
- Comprehensive feature set (10+ features)

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
- temporal-polyfill for timezone/DST-correct date math
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
