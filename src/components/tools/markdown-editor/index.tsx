"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Copy, Download, Check, Eye, FileText, Settings } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface MarkdownTemplate {
  name: string;
  content: string;
  description: string;
}

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState("");
  const [theme, setTheme] = useState("github");
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [enableTables, setEnableTables] = useState(true);
  const [enableTaskLists, setEnableTaskLists] = useState(true);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const templates: MarkdownTemplate[] = [
    {
      name: "README",
      description: "Basic README structure",
      content: `# Project Name

## Description
A brief description of what this project does and who it's for.

## Installation
\`\`\`bash
npm install project-name
\`\`\`

## Usage
\`\`\`javascript
const example = require('project-name');
example.doSomething();
\`\`\`

## Features
- Feature 1
- Feature 2
- Feature 3

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

## License
[MIT](https://choosealicense.com/licenses/mit/)`,
    },
    {
      name: "Documentation",
      description: "Technical documentation template",
      content: `# API Documentation

## Overview
This document describes the API endpoints and their usage.

## Authentication
All API requests require authentication using an API key:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.example.com/endpoint
\`\`\`

## Endpoints

### GET /users
Retrieve a list of users.

**Parameters:**
- \`limit\` (optional): Number of users to return
- \`offset\` (optional): Number of users to skip

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
\`\`\`

## Error Handling
The API uses standard HTTP status codes:
- \`200\` - Success
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`404\` - Not Found
- \`500\` - Internal Server Error`,
    },
    {
      name: "Blog Post",
      description: "Blog post structure",
      content: `# Blog Post Title

*Published on: ${new Date().toLocaleDateString()}*

## Introduction
Write an engaging introduction that hooks your readers and gives them a preview of what they'll learn.

## Main Content

### Section 1
Detailed explanation of your first main point.

> "A meaningful quote that supports your argument."

### Section 2
Continue with your second main point. You can include:

- Bullet points for clarity
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms

### Code Examples
\`\`\`javascript
function example() {
  console.log("Hello, World!");
}
\`\`\`

## Conclusion
Summarize your key points and provide actionable takeaways for your readers.

---

*Tags: #markdown #writing #blog*`,
    },
    {
      name: "Table Example",
      description: "Table formatting examples",
      content: `# Tables in Markdown

## Basic Table
| Name | Age | City |
|------|-----|------|
| John | 25 | New York |
| Jane | 30 | London |
| Bob | 35 | Tokyo |

## Aligned Table
| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Text | Text | Text |
| More text | More text | More text |

## Task List
- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Mixed Content Table
| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Complete | OAuth 2.0 implemented |
| User Management | 🚧 In Progress | 80% complete |
| Notifications | ❌ Not Started | Planned for v2.0 |`,
    },
  ];

  // Improved Markdown to HTML converter
  const convertMarkdownToHtml = useCallback(
    (md: string): string => {
      if (!md) return "";

      let html = md;

      // Escape HTML first
      html = html.replace(/&/g, "&amp;");
      html = html.replace(/</g, "&lt;");
      html = html.replace(/>/g, "&gt;");

      // Code blocks (process first to avoid interference)
      html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (_, lang, code) => {
        return `<pre class="bg-gray-100 text-white dark:bg-gray-800 p-3 rounded overflow-x-auto"><code class="language-${lang || "text"}">${code.trim()}</code></pre>`;
      });

      // Inline code
      html = html.replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 text-white dark:bg-gray-800 px-1 rounded text-sm">$1</code>',
      );

      // Headers (must be at start of line)
      html = html.replace(
        /^### (.*$)/gm,
        '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>',
      );
      html = html.replace(
        /^## (.*$)/gm,
        '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>',
      );
      html = html.replace(
        /^# (.*$)/gm,
        '<h1 class="text-2xl font-bold mb-4 mt-8">$1</h1>',
      );

      // Bold and Italic (process before other formatting)
      html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html = html.replace(/_(.*?)_/g, "<em>$1</em>");

      // Links
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>',
      );

      // Images
      html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="max-w-full h-auto rounded" />',
      );

      // Blockquotes
      html = html.replace(
        /^> (.+)$/gm,
        '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400 my-2">$1</blockquote>',
      );

      // Horizontal rules
      html = html.replace(
        /^---$/gm,
        '<hr class="border-t border-gray-300 my-4" />',
      );

      // Task lists (if enabled)
      if (enableTaskLists) {
        html = html.replace(
          /^- \[x\] (.+)$/gm,
          '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded"> <span>$1</span></div>',
        );
        html = html.replace(
          /^- \[ \] (.+)$/gm,
          '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded"> <span>$1</span></div>',
        );
      }

      // Regular lists (unordered)
      html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
      html = html.replace(/^\* (.+)$/gm, '<li class="ml-4">$1</li>');

      // Regular lists (ordered)
      html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>');

      // Wrap consecutive list items in ul/ol tags
      html = html.replace(
        /(<li class="ml-4">.*?<\/li>(\s*<li class="ml-4">.*?<\/li>)*)/g,
        '<ul class="list-disc list-inside my-2 space-y-1">$1</ul>',
      );

      // Tables (if enabled)
      if (enableTables) {
        const lines = html.split("\n");
        const processedLines: string[] = [];
        let inTable = false;
        let tableRows: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.includes("|") && line.split("|").length > 2) {
            const cells = line
              .split("|")
              .map((cell) => cell.trim())
              .filter((cell) => cell);

            // Skip separator lines
            if (cells.every((cell) => /^:?-+:?$/.test(cell))) {
              continue;
            }

            if (!inTable) {
              inTable = true;
              tableRows = [];
            }

            const isFirstRow = tableRows.length === 0;
            const tag = isFirstRow ? "th" : "td";
            const cellClass = isFirstRow
              ? "border border-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left"
              : "border border-gray-300 px-3 py-2";

            let row = "<tr>";
            cells.forEach((cell) => {
              row += `<${tag} class="${cellClass}">${cell}</${tag}>`;
            });
            row += "</tr>";
            tableRows.push(row);
          } else {
            if (inTable) {
              const tableHtml = `<table class="w-full border-collapse border border-gray-300 my-4">${tableRows.join("")}</table>`;
              processedLines.push(tableHtml);
              inTable = false;
              tableRows = [];
            }
            processedLines.push(line);
          }
        }

        if (inTable && tableRows.length > 0) {
          const tableHtml = `<table class="w-full border-collapse border border-gray-300 my-4">${tableRows.join("")}</table>`;
          processedLines.push(tableHtml);
        }

        html = processedLines.join("\n");
      }

      // Convert line breaks to paragraphs
      const paragraphs = html.split("\n\n").filter((p) => p.trim());
      html = paragraphs
        .map((p) => {
          const trimmed = p.trim();
          // Don't wrap if it's already an HTML element
          if (trimmed.startsWith("<") || !trimmed) {
            return trimmed;
          }
          return `<p class="mb-4">${trimmed.replace(/\n/g, "<br>")}</p>`;
        })
        .join("\n");

      return html;
    },
    [enableTables, enableTaskLists],
  );

  const htmlOutput = useMemo(() => {
    return convertMarkdownToHtml(markdown);
  }, [markdown, convertMarkdownToHtml]);

  const copyToClipboard = async (text: string, type: "html" | "markdown") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "html") {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } else {
        setCopiedMarkdown(true);
        setTimeout(() => setCopiedMarkdown(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadTemplate = (template: MarkdownTemplate) => {
    setMarkdown(template.content);
  };

  const clearEditor = () => {
    setMarkdown("");
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.slice(start, end);

    let insertion = syntax;
    if (syntax.includes("TEXT")) {
      insertion = syntax.replace("TEXT", selectedText || "text");
    }

    const newText = markdown.slice(0, start) + insertion + markdown.slice(end);
    setMarkdown(newText);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertion.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const getPreviewThemeClass = () => {
    switch (theme) {
      case "dark":
        return "bg-gray-900 text-gray-100";
      case "minimal":
        return "bg-white text-gray-900 font-serif";
      default:
        return "bg-white text-gray-900";
    }
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Markdown Editor & Preview
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Write and preview Markdown with live rendering and export options
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preview Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="line-numbers">Line Numbers</Label>
              <Switch
                id="line-numbers"
                checked={showLineNumbers}
                onCheckedChange={setShowLineNumbers}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tables">Enable Tables</Label>
              <Switch
                id="tables"
                checked={enableTables}
                onCheckedChange={setEnableTables}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="task-lists">Task Lists</Label>
              <Switch
                id="task-lists"
                checked={enableTaskLists}
                onCheckedChange={setEnableTaskLists}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Insert */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Insert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("**TEXT**")}
              >
                Bold
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("*TEXT*")}
              >
                Italic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("`TEXT`")}
              >
                Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("[TEXT](url)")}
              >
                Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("# TEXT")}
              >
                H1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("## TEXT")}
              >
                H2
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("- TEXT")}
              >
                List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("> TEXT")}
              >
                Quote
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate(template)}
                  className="h-auto w-full justify-start p-3 text-left"
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Editor */}
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Markdown Editor
              </CardTitle>
              <CardDescription>
                Write your Markdown content here
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(markdown, "markdown")}
                className="w-full sm:w-auto"
              >
                {copiedMarkdown ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy MD
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearEditor}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Start writing your Markdown here...

Try some **bold text**, *italic text*, or `inline code`.

- Create lists
- Add [links](https://example.com)
- Insert code blocks

```javascript
console.log('Hello, World!');
```"
              className={`min-h-[400px] resize-none font-mono text-sm ${showLineNumbers ? "pl-12" : ""}`}
              style={{
                lineHeight: "1.5",
                backgroundImage: showLineNumbers
                  ? `linear-gradient(to bottom, transparent 0%, transparent calc(1.5em - 1px), #e5e5e5 calc(1.5em - 1px), #e5e5e5 1.5em)`
                  : "none",
                backgroundSize: "100% 1.5em",
                backgroundAttachment: "local",
              }}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your Markdown will look</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(htmlOutput, "html")}
                className="w-full sm:w-auto"
              >
                {copiedHtml ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy HTML
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadFile(htmlOutput, "preview.html", "text/html")
                }
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`min-h-[400px] overflow-auto rounded border p-4 ${getPreviewThemeClass()}`}
              dangerouslySetInnerHTML={{
                __html:
                  htmlOutput ||
                  '<p class="text-gray-500">Start typing in the editor to see the preview...</p>',
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Markdown Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">Headers</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1"># H1</code>
                </li>
                <li>
                  <code className="rounded bg-muted px-1">## H2</code>
                </li>
                <li>
                  <code className="rounded bg-muted px-1">### H3</code>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Emphasis</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">**bold**</code>
                </li>
                <li>
                  <code className="rounded bg-muted px-1">*italic*</code>
                </li>
                <li>
                  <code className="rounded bg-muted px-1">`code`</code>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Lists & Links</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">- item</code>
                </li>
                <li>
                  <code className="rounded bg-muted px-1">1. item</code>
                </li>
                <li>
                  <code className="rounded bg-muted px-1">[link](url)</code>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
