# 🤝 Contributing to OpenSource Toolkit

Thank you for your interest in contributing to OpenSource Toolkit! We welcome contributions from developers of all skill levels. This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Contributing Guidelines](#-contributing-guidelines)
- [Adding New Tools](#-adding-new-tools)
- [Code Style Guidelines](#-code-style-guidelines)
- [Testing Guidelines](#-testing-guidelines)
- [Submitting Changes](#-submitting-changes)
- [Review Process](#-review-process)
- [Community](#-community)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We are committed to providing a welcoming and inspiring community for all.

### Our Standards

- **Be respectful** and inclusive in your communications
- **Be collaborative** and help others learn and grow
- **Be constructive** when providing feedback
- **Be patient** with newcomers and different perspectives
- **Be professional** in all interactions

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **npm**, **yarn**, or **pnpm** (package manager)
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/OpensourceToolkit.git
cd OpensourceToolkit

# Add the original repository as upstream
git remote add upstream https://github.com/truethari/OpensourceToolkit.git
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Start Development Server

```bash
npm run dev
```

The development server will start at `http://localhost:5001`.

### 4. Verify Setup

- Visit `http://localhost:5001` to see the application
- Run `npm run lint` to check for linting issues
- Run `npm run format` to format the code

## 🎯 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

1. **🔧 New Tools** - Add new utility tools to the toolkit
2. **🐛 Bug Fixes** - Fix existing issues and improve functionality
3. **✨ Feature Enhancements** - Improve existing tools with new features
4. **📚 Documentation** - Improve documentation, README, or guides
5. **🎨 UI/UX Improvements** - Enhance the user interface and experience
6. **⚡ Performance** - Optimize performance and bundle size
7. **🧪 Testing** - Add tests for existing functionality

### Before You Start

1. **Check existing issues** to see if your idea is already being worked on
2. **Open an issue** to discuss major changes before implementing
3. **Look for "good first issue"** labels for beginner-friendly tasks
4. **Ask questions** in discussions if you're unsure about anything

## 🔧 Adding New Tools

### Step-by-Step Guide

#### 1. Plan Your Tool

- **Purpose**: What problem does it solve?
- **Features**: What functionality will it provide?
- **Category**: Which category does it fit in? (Security, Generators, Converters, File Tools)
- **Design**: How will the UI/UX work?

#### 2. Create the Tool Component

```bash
# Create the component directory
mkdir src/components/tools/your-tool-name
```

Create `src/components/tools/your-tool-name/index.tsx`:

```typescript
"use client";

import { Copy } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function YourToolName() {
  const [result, setResult] = useState("");

  const handleAction = () => {
    // Your tool logic here
    setResult("Generated result");
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Your Tool Name</h1>
        <p className="text-muted-foreground">
          Brief description of what your tool does
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Interface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleAction} className="w-full">
            Generate/Process
          </Button>

          {result && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Result:</label>
              <div className="flex items-center space-x-2">
                <input
                  value={result}
                  readOnly
                  className="flex-1 rounded border px-3 py-2"
                />
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
```

#### 3. Create the Page Route

Create `src/app/(tools)/your-tool-name/page.tsx`:

```typescript
import { generateSEO } from "@/utils/SEO";
import YourToolName from "@/components/tools/your-tool-name";

export const metadata = generateSEO({
  title: "Your Tool Name - OpenSource Toolkit",
  description: "Description of your tool functionality",
  keywords: "keyword1, keyword2, keyword3",
});

export default function YourToolNamePage() {
  return <YourToolName />;
}
```

#### 4. Register the Tool

Add your tool to `src/config/index.ts`:

```typescript
import { YourIcon } from "lucide-react";

export const tools: ITool[] = [
  // ... existing tools
  {
    id: "your-tool-name",
    title: "Your Tool Name",
    shortTitle: "Short Name",
    description: "Brief description of your tool",
    icon: YourIcon,
    color: "bg-blue-500", // Choose appropriate color
    category: "Appropriate Category", // Security, Generators, Converters, File Tools
    tags: ["tag1", "tag2", "tag3"],
    features: ["Feature 1", "Feature 2", "Feature 3"],
    popular: false, // Set to true if it should be featured
    href: "/your-tool-name",
    seo: {
      title: "Your Tool Name - Description",
      description: "Detailed SEO description",
      keywords: "seo, keywords, here",
    },
  },
];
```

#### 5. Add Icon Import

Update the icon imports in `src/config/index.ts`:

```typescript
import {
  // ... existing icons
  YourIcon,
} from "lucide-react";
```

### Tool Development Best Practices

#### UI/UX Guidelines

- **Consistent Design**: Follow the existing design patterns and component usage
- **Responsive**: Ensure your tool works on all screen sizes
- **Accessible**: Use proper ARIA labels and semantic HTML
- **Dark Theme**: Design for the dark theme (default)
- **Loading States**: Show appropriate loading indicators
- **Error Handling**: Provide clear error messages

#### Functionality Guidelines

- **Client-Side Processing**: Keep all processing client-side for privacy
- **Performance**: Optimize for speed and efficiency
- **Input Validation**: Validate all user inputs
- **Copy to Clipboard**: Implement copy functionality for results
- **Batch Processing**: Consider batch operations when applicable
- **Clear/Reset**: Provide ways to clear inputs and start over

#### Code Structure

```typescript
// Typical tool component structure
export default function YourTool() {
  // 1. State management
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Core logic functions
  const processInput = useCallback(() => {
    // Tool-specific logic
  }, [input]);

  // 3. Utility functions
  const copyToClipboard = async (text: string) => {
    // Copy implementation
  };

  const resetForm = () => {
    // Reset implementation
  };

  // 4. Render
  return (
    // JSX structure
  );
}
```

## 🎨 Code Style Guidelines

### TypeScript

- **Use TypeScript** for all new code
- **Define interfaces** for complex objects
- **Use proper typing** - avoid `any` type
- **Export types** when they might be reused

```typescript
// Good
interface ToolOptions {
  input: string;
  format: "json" | "xml" | "csv";
  validate: boolean;
}

// Avoid
const options: any = {
  input: "text",
  format: "json",
  validate: true,
};
```

### React Patterns

- **Use functional components** with hooks
- **Use `useCallback`** for event handlers
- **Use `useMemo`** for expensive calculations
- **Prefer composition** over inheritance

```typescript
// Good
const MemoizedComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

### Component Structure

```typescript
// Component file structure
"use client";

// 1. React imports
import React, { useState, useCallback } from "react";

// 2. UI component imports
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 3. Icon imports
import { Copy, Download } from "lucide-react";

// 4. Type definitions
interface ComponentProps {
  // prop types
}

// 5. Component implementation
export default function Component({}: ComponentProps) {
  // component logic
}
```

### Styling

- **Use Tailwind classes** for styling
- **Follow the design system** colors and spacing
- **Use CSS variables** for custom properties
- **Mobile-first** responsive design

```typescript
// Good
<div className="mx-auto max-w-4xl space-y-6 p-6">
  <Card className="border-border">
    <CardContent className="space-y-4">
      // content
    </CardContent>
  </Card>
</div>
```

### File Naming

- **Components**: PascalCase (`YourComponent.tsx`)
- **Files**: kebab-case (`your-file-name.ts`)
- **Directories**: kebab-case (`your-directory`)

## 🧪 Testing Guidelines

### Manual Testing

Before submitting your changes:

1. **Test all functionality** thoroughly
2. **Test responsive design** on different screen sizes
3. **Test with different inputs** including edge cases
4. **Test error scenarios** and empty states
5. **Test copy-to-clipboard** functionality
6. **Test navigation** to and from your tool

### Browser Testing

Test your tool in:

- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Mobile browsers** (Chrome Mobile, Safari iOS)

### Performance Testing

- **Check bundle size** impact
- **Test with large inputs** if applicable
- **Monitor memory usage** for memory-intensive tools
- **Test loading performance**

## 📝 Submitting Changes

### Commit Guidelines

Follow conventional commit format:

```bash
type(scope): description

# Examples:
feat(tools): add color palette generator
fix(jwt): resolve token validation issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(utils): optimize text processing functions
```

### Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Sync with upstream**:

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following the guidelines

4. **Test thoroughly** using the testing guidelines

5. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat(tools): add your new tool"
   ```

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

### Pull Request Template

When creating a PR, please include:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

- [ ] Manual testing completed
- [ ] Responsive design tested
- [ ] Browser compatibility tested
- [ ] Edge cases tested

## Screenshots (if applicable)

Add screenshots of your changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## 🔍 Review Process

### What We Look For

- **Code Quality**: Clean, readable, and maintainable code
- **Functionality**: Tool works as expected
- **Performance**: No significant performance regressions
- **Design**: Follows existing design patterns
- **Documentation**: Adequate documentation and comments
- **Testing**: Thoroughly tested functionality

### Review Timeline

- **Initial Response**: Within 48 hours
- **Code Review**: Within 1 week
- **Feedback Incorporation**: Depends on changes needed
- **Final Approval**: After all feedback is addressed

### Feedback Process

- Reviewers will provide constructive feedback
- Address feedback promptly and professionally
- Ask questions if feedback is unclear
- Update your PR based on suggestions

## 💬 Community

### Getting Help

- **GitHub Discussions**: For general questions and ideas
- **GitHub Issues**: For bug reports and feature requests
- **Code Reviews**: Learn from feedback on your PRs

### Recognition

Contributors are recognized in:

- **README.md**: Contributors section
- **Release Notes**: Major contributions
- **Hall of Fame**: Outstanding contributors

### Becoming a Maintainer

Regular contributors may be invited to become maintainers with:

- **Review permissions**
- **Direct commit access**
- **Release management** responsibilities

## 📚 Additional Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)

### Tools & Extensions

- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter)

---

## 🙏 Thank You

Thank you for contributing to OpenSource Toolkit! Your contributions help make this project better for everyone. We appreciate your time, effort, and dedication to the open-source community.

**Happy coding! 🚀**

---

<div align="center">

**Questions?** Feel free to open a [discussion](https://github.com/truethari/OpensourceToolkit/discussions) or reach out to the maintainers.

</div>
