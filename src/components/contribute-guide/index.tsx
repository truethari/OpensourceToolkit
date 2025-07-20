"use client";

import { useState } from "react";
import {
  Zap,
  Info,
  Code,
  Star,
  Globe,
  Users,
  Coffee,
  Package,
  Terminal,
  Settings,
  BookOpen,
  FileText,
  GitBranch,
  GitCommit,
  Lightbulb,
  FolderTree,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  GitPullRequest,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

export default function ContributeGuide() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 0, title: "Setup", icon: Settings, status: "pending" },
    { id: 1, title: "Create Tool", icon: Code, status: "pending" },
    { id: 2, title: "Test", icon: CheckCircle, status: "pending" },
    { id: 3, title: "Submit", icon: GitPullRequest, status: "pending" },
  ];

  const toolCategories = [
    {
      name: "Generators",
      color: "bg-blue-500",
      tools: ["UUID", "Password", "Lorem Ipsum", "Mock Data", "ASCII Art"],
    },
    {
      name: "Converters",
      color: "bg-green-500",
      tools: ["Base64", "Text Case", "Image Format", "Timestamp"],
    },
    {
      name: "Security",
      color: "bg-red-500",
      tools: ["JWT", "HMAC", "Password Generator"],
    },
    {
      name: "Network Tools",
      color: "bg-purple-500",
      tools: ["DNS Lookup", "IP Location", "Speed Test", "Uptime Monitor"],
    },
    {
      name: "Development Tools",
      color: "bg-orange-500",
      tools: ["API Tester", "Cron Scheduler"],
    },
    {
      name: "File Tools",
      color: "bg-teal-500",
      tools: ["PDF Toolkit", "Folder Analyzer"],
    },
  ];

  const commitTypes = [
    {
      type: "feat",
      description: "A new feature or tool",
      example: "feat(uuid): add UUID v5 support",
    },
    {
      type: "fix",
      description: "A bug fix",
      example: "fix(jwt): resolve token validation issue",
    },
    {
      type: "docs",
      description: "Documentation changes",
      example: "docs: update contribution guidelines",
    },
    {
      type: "style",
      description: "Code style changes",
      example: "style: fix eslint warnings",
    },
    {
      type: "refactor",
      description: "Code refactoring",
      example: "refactor(api-tester): simplify request logic",
    },
    {
      type: "test",
      description: "Adding tests",
      example: "test: add unit tests for base64 encoder",
    },
    {
      type: "chore",
      description: "Maintenance tasks",
      example: "chore: update dependencies",
    },
  ];

  return (
    <div className="mx-auto mt-2 max-w-7xl space-y-8 p-6 pb-12 md:mt-10">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <div className="mb-4 flex items-center justify-center space-x-2">
          <h1 className="animated-gradient-text-2">
            Contribute to OpensourceToolkit
          </h1>
        </div>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground md:text-xl">
          Help us build the most comprehensive collection of developer tools!
          Whether you&apos;re adding a new tool, fixing bugs, or improving
          documentation, your contribution makes a difference.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <Badge variant="secondary" className="text-sm">
            <Users className="mr-1 h-4 w-4" />
            Community Driven
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Star className="mr-1 h-4 w-4" />
            Open Source
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Zap className="mr-1 h-4 w-4" />
            Modern Stack
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex flex-col gap-2">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="structure">
              <span className="hidden md:block">Project</span>{" "}
              <span className="pl-1">Structure</span>
            </TabsTrigger>
            <TabsTrigger value="tools">Creating Tools</TabsTrigger>
            <TabsTrigger value="guidelines" className="hidden md:block">
              Guidelines
            </TabsTrigger>
            <TabsTrigger value="process" className="hidden md:block">
              Process
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 md:hidden">
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-blue-400 bg-blue-800/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  <span>Tech Stack</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Next.js 15</Badge>
                  <Badge variant="outline">React 19</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Radix UI</Badge>
                  <Badge variant="outline">Lucide Icons</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500 bg-green-800/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <span>Quick Start</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md bg-gray-900 p-3 font-mono text-sm text-green-400">
                  <div>git clone &lt;repo&gt;</div>
                  <div>npm install</div>
                  <div>npm run dev</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500 bg-purple-800/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <span>Live Development</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Development server runs on port 5001 with hot reload and
                  Turbopack for fast builds.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open("/contribute-guide", "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  localhost:5001
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Why Contribute?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold">
                        Help Developers Worldwide
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Your tools will be used by developers across the globe
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold">Learn & Grow</h4>
                      <p className="text-sm text-muted-foreground">
                        Work with modern technologies and best practices
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold">Build Your Portfolio</h4>
                      <p className="text-sm text-muted-foreground">
                        Showcase your contributions to potential employers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold">Join the Community</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect with like-minded developers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderTree className="h-5 w-5 text-blue-500" />
                <span>Tool Categories</span>
              </CardTitle>
              <CardDescription>
                Current categories and their tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {toolCategories.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-3 w-3 rounded-full ${category.color}`}
                      />
                      <h4 className="font-semibold">{category.name}</h4>
                    </div>
                    <div className="space-y-1">
                      {category.tools.map((tool) => (
                        <Badge
                          key={tool}
                          variant="secondary"
                          className="mb-1 mr-1 text-xs"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Structure Tab */}
        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderTree className="h-5 w-5 text-blue-500" />
                <span>Project Architecture</span>
              </CardTitle>
              <CardDescription>
                Understanding the codebase structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg bg-gray-900 p-6 font-mono text-sm text-gray-100">
                <div className="space-y-1">
                  <div className="text-blue-400">📁 src/</div>
                  <div className="ml-4 text-green-400">📁 app/</div>
                  <div className="ml-8 text-yellow-400">📁 (tools)/</div>
                  <div className="ml-12 text-gray-300">📁 tool-name/</div>
                  <div className="ml-16 text-gray-300">📄 page.tsx</div>
                  <div className="ml-8 text-yellow-400">
                    📁 contribute-guide/
                  </div>
                  <div className="ml-8 text-gray-300">📄 layout.tsx</div>
                  <div className="ml-8 text-gray-300">📄 page.tsx</div>
                  <div className="ml-4 text-green-400">📁 components/</div>
                  <div className="ml-8 text-yellow-400">📁 tools/</div>
                  <div className="ml-12 text-gray-300">📁 tool-name/</div>
                  <div className="ml-16 text-gray-300">📄 index.tsx</div>
                  <div className="ml-16 text-gray-300">
                    📄 types.ts (optional)
                  </div>
                  <div className="ml-16 text-gray-300">
                    📄 utils.ts (optional)
                  </div>
                  <div className="ml-8 text-yellow-400">📁 ui/</div>
                  <div className="ml-8 text-yellow-400">📁 general/</div>
                  <div className="ml-4 text-green-400">📁 config/</div>
                  <div className="ml-8 text-gray-300">📄 index.ts</div>
                  <div className="ml-4 text-green-400">📁 lib/</div>
                  <div className="ml-4 text-green-400">📁 types/</div>
                  <div className="ml-4 text-green-400">📁 utils/</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span>Key Files</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-gray-800 px-2 py-1 text-sm">
                      config/index.ts
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tool registry with metadata, SEO, and routing
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-gray-800 px-2 py-1 text-sm">
                      types/index.ts
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    TypeScript interfaces and type definitions
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-gray-800 px-2 py-1 text-sm">
                      utils/SEO.ts
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    SEO helper functions for meta tags
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-orange-500" />
                  <span>Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-gray-800 px-2 py-1 text-sm">
                      package.json
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dependencies and scripts configuration
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-gray-800 px-2 py-1 text-sm">
                      tailwind.config.js
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tailwind CSS and design system setup
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-gray-800 px-2 py-1 text-sm">
                      next.config.js
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Next.js configuration and optimizations
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Pattern:</strong> Each tool follows a consistent pattern
              with a page component in <code>app/(tools)/</code>
              that imports the main component from{" "}
              <code>components/tools/</code>. This separation allows for better
              organization and reusability.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Creating Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-500" />
                <span>Step-by-Step Tool Creation</span>
              </CardTitle>
              <CardDescription>
                Follow this process to add a new tool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div
                      className={`rounded-full p-2 ${index <= activeStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">
                        {index + 1}. {step.title}
                      </h4>
                      <div className="mt-2">
                        {index === 0 && (
                          <div className="space-y-3">
                            <p className="text-muted-foreground">
                              Set up your development environment
                            </p>
                            <div className="rounded-md bg-gray-900 p-3 font-mono text-sm text-green-400">
                              <div># Clone the repository</div>
                              <div>
                                git clone
                                https://github.com/truethari/OpensourceToolkit
                              </div>
                              <div>cd OpensourceToolkit</div>
                              <div className="mt-2"># Install dependencies</div>
                              <div>npm install</div>
                              <div className="mt-2">
                                # Start development server
                              </div>
                              <div>npm run dev</div>
                            </div>
                          </div>
                        )}
                        {index === 1 && (
                          <div className="space-y-3">
                            <p className="text-muted-foreground">
                              Create your tool files and components
                            </p>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <strong>1. Create the main component:</strong>
                                <code className="ml-2 rounded bg-gray-800 px-2 py-1 text-sm">
                                  src/components/tools/OpensourceToolkit/index.tsx
                                </code>
                              </div>
                              <div className="text-sm">
                                <strong>2. Create the page:</strong>
                                <code className="ml-2 rounded bg-gray-800 px-2 py-1 text-sm">
                                  src/app/(tools)/OpensourceToolkit/page.tsx
                                </code>
                              </div>
                              <div className="text-sm">
                                <strong>3. Add to config:</strong>
                                <code className="ml-2 rounded bg-gray-800 px-2 py-1 text-sm">
                                  src/config/index.ts
                                </code>
                              </div>
                            </div>
                          </div>
                        )}
                        {index === 2 && (
                          <div className="space-y-3">
                            <p className="text-muted-foreground">
                              Test your tool thoroughly
                            </p>
                            <div className="rounded-md bg-gray-900 p-3 font-mono text-sm text-green-400">
                              <div># Run linting and formatting</div>
                              <div>npm run test</div>
                              <div className="mt-2"># Build the project</div>
                              <div>npm run build</div>
                            </div>
                          </div>
                        )}
                        {index === 3 && (
                          <div className="space-y-3">
                            <p className="text-muted-foreground">
                              Submit your contribution
                            </p>
                            <div className="rounded-md bg-gray-900 p-3 font-mono text-sm text-green-400">
                              <div># Create a new branch</div>
                              <div>git checkout -b feat/your-tool-name</div>
                              <div className="mt-2"># Commit your changes</div>
                              <div>git add .</div>
                              <div>
                                git commit -m &quot;feat(your-tool): add
                                description&quot;
                              </div>
                              <div className="mt-2"># Push and create PR</div>
                              <div>git push origin feat/your-tool-name</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() =>
                          setActiveStep(
                            Math.max(0, Math.min(steps.length - 1, index)),
                          )
                        }
                      >
                        {index <= activeStep ? "Completed" : "View Details"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-green-500" />
                <span>Tool Template</span>
              </CardTitle>
              <CardDescription>
                Basic template for creating a new tool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100">
                <pre className="text-sm">
                  {`"use client";

import { useState } from "react";
import { Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { class } from '../../../node_modules/zod/v4/core/registries';

export default function YourTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleProcess = () => {
    // Your tool logic here
    setOutput(input.toUpperCase()); // Example
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Your Tool Name</h1>
        <p className="text-muted-foreground">
          Description of what your tool does
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Enter your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input">Input Data</Label>
            <Input
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your data..."
            />
          </div>
          <Button onClick={handleProcess}>
            Process
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono">
              {output}
            </div>
            <Button variant="outline" className="mt-4">
              <Copy className="h-4 w-4 mr-2" />
              Copy Result
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitCommit className="h-5 w-5 text-purple-500" />
                <span>Commit Message Convention</span>
              </CardTitle>
              <CardDescription>
                Follow conventional commits for consistency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Format: <code>type(scope): description</code>
                    <br />
                    Example:{" "}
                    <code>
                      feat(uuid): add UUID v5 support with namespace handling
                    </code>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {commitTypes.map((commit) => (
                    <div key={commit.type} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center space-x-2">
                        <Badge variant="outline">{commit.type}</Badge>
                        <span className="font-semibold">
                          {commit.description}
                        </span>
                      </div>
                      <code className="block rounded bg-gray-800 p-2 text-sm">
                        {commit.example}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Code Standards</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">TypeScript</p>
                    <p className="text-sm text-muted-foreground">
                      Use TypeScript for all components
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">ESLint & Prettier</p>
                    <p className="text-sm text-muted-foreground">
                      Follow linting and formatting rules
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">Component Structure</p>
                    <p className="text-sm text-muted-foreground">
                      Use existing UI components from shadcn/ui
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">Responsive Design</p>
                    <p className="text-sm text-muted-foreground">
                      Ensure mobile compatibility
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Security Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="mt-1 h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">Client-Side Processing</p>
                    <p className="text-sm text-muted-foreground">
                      Process sensitive data on the client
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="mt-1 h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">No Data Storage</p>
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t store user data on servers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="mt-1 h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">Input Validation</p>
                    <p className="text-sm text-muted-foreground">
                      Validate all user inputs
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="mt-1 h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">Safe Dependencies</p>
                    <p className="text-sm text-muted-foreground">
                      Use trusted and updated packages
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span>Tool Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Essential Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Clear input/output interface
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Copy to clipboard functionality
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Error handling and validation
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Responsive design</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Nice to Have</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        Batch processing capabilities
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Export functionality</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">History/recent items</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Keyboard shortcuts</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Tab */}
        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-green-500" />
                <span>Git Workflow</span>
              </CardTitle>
              <CardDescription>
                Follow this workflow for contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100">
                  <pre className="text-sm">
                    {`# 1. Fork and clone the repository
git clone https://github.com/truethari/OpensourceToolkit.git
cd OpensourceToolkit

# 2. Create a new branch
git checkout -b feat/your-tool-name

# 3. Make your changes
# ... develop your tool ...

# 4. Test your changes
npm run test
npm run build

# 5. Commit your changes
git add .
git commit -m "feat(your-tool): add comprehensive description"

# 6. Push to your fork
git push origin feat/your-tool-name

# 7. Create a Pull Request on GitHub`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitPullRequest className="h-5 w-5 text-purple-500" />
                <span>Pull Request Process</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold">PR Checklist</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          Clear and descriptive title
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          Detailed description of changes
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          Screenshots or demo links
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Tests pass locally</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Review Process</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Maintainer review within 48 hours
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Feedback and requested changes
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Final approval and merge
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Automatic deployment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coffee className="text-brown-500 h-5 w-5" />
                <span>Getting Help</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Community Support</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() =>
                          window.open(
                            "https://github.com/truethari/OpensourceToolkit/discussions",
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        GitHub Discussions
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Resources</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() =>
                          window.open(
                            "https://github.com/truethari/OpensourceToolkit/blob/master/README.md",
                            "_blank",
                          )
                        }
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        README.md
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-4 text-center">
        <h3 className="text-2xl font-bold">Ready to Contribute?</h3>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          We&apos;re excited to see what amazing tools you&apos;ll create!
          Remember, every contribution, no matter how small, makes a difference
          in the developer community.
        </p>
        <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:gap-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            onClick={() =>
              window.open(
                "https://github.com/truethari/OpensourceToolkit",
                "_blank",
              )
            }
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Start Contributing
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              window.open(
                "https://github.com/truethari/OpensourceToolkit/blob/master/README.md",
                "_blank",
              )
            }
          >
            <BookOpen className="mr-2 h-5 w-5" />
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
