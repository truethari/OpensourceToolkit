"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo, useCallback } from "react";
import {
  Star,
  Code,
  Users,
  Search,
  Palette,
  Sparkles,
  Bookmark,
  ArrowRight,
  Github,
  Heart,
  GitFork,
  Scale,
  ExternalLink,
  Coffee,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import { tools } from "@/config";
import { useData } from "@/providers/DataProvider";

import type { ITool } from "@/types";

export default function Home() {
  const router = useRouter();
  const { recentTools, addRecentTool } = useData();

  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { name: "All Tools", count: tools.length },
    {
      name: "Generators",
      count: tools.filter((t) => t.category === "Generators").length,
    },
    {
      name: "Converters",
      count: tools.filter((t) => t.category === "Converters").length,
    },
  ];

  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const handleToolClick = useCallback(
    (tool: ITool) => {
      // Update recently used
      addRecentTool(tool);

      router.push(tool.href);
    },
    [addRecentTool, router],
  );

  const quickActions = useMemo(() => {
    const allPopularTools = tools.filter((tool) => tool.popular);
    // get random 6 popular tools
    const randomPopularTools = allPopularTools
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    return randomPopularTools.map((tool) => ({
      title: tool.title,
      description: tool.description,
      action: () => handleToolClick(tool),
      icon: tool.icon,
      iconColor: tool.color,
    }));
  }, [handleToolClick]);

  return (
    <div className="mx-auto max-w-7xl p-2 md:space-y-6 md:p-6">
      {/* Hero Section */}
      <div className="border-b">
        <div className="mx-auto mb-4 max-w-7xl px-6 py-8">
          <div className="space-y-6 text-center">
            <div className="mb-4 flex flex-col items-center justify-center gap-5 space-x-2 md:flex-row md:gap-0">
              <div className="rounded-2xl border bg-slate-700 p-3">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h1 className="animated-gradient-text text-4xl font-bold md:text-5xl">
                OpenSource Toolkit
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Open source collection of useful daily utilities. Built by the
              community for developers and users. Contribute your own tools and
              components.
            </p>

            {/* Live Stats */}
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{tools.length} Tools Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-2 py-8 md:px-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search tools, features, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:text-md h-12 border-slate-700 pl-12 text-sm focus-visible:ring-1 focus-visible:ring-slate-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer border transition-all duration-300 hover:border-slate-600 hover:bg-slate-900 hover:shadow-md"
                onClick={action.action}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`rounded-xl ${action.iconColor} border p-3`}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="md:text-md text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recently Used */}
        {recentTools.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold">Recently Used</h2>
              <Badge variant="secondary" className="text-slate-300">
                <Bookmark className="mr-1 h-3 w-3" />
                Quick Access
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              {recentTools.map((recentTool) => {
                const tool = tools.find((t) => t.id === recentTool.id);
                if (!tool) return null;
                return (
                  <Button
                    key={recentTool.id}
                    variant="outline"
                    onClick={() => handleToolClick(tool)}
                    className="h-auto p-2 transition-colors hover:border-slate-600 hover:bg-slate-900"
                  >
                    <tool.icon className="h-4 w-4" />
                    {tool.title}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer px-4 py-2 text-sm transition-colors hover:border-slate-600 hover:bg-slate-900"
              >
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Available Tools</h2>
            <Badge variant="secondary" className="text-slate-300">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "tool" : "tools"} found
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredTools.map((tool) => (
              <Card
                key={tool.id}
                className="group cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:border-slate-600 hover:shadow-lg"
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 ${tool.color} rounded-xl border`}>
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span className="leading-normal">{tool.title}</span>
                          {tool.popular && (
                            <Badge
                              variant="secondary"
                              className="bg-slate-800 text-slate-300"
                            >
                              <Star className="mr-1 h-3 w-3" />
                              Popular
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {tool.category}
                        </Badge>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="md:text-md text-sm leading-relaxed">
                    {tool.description}
                  </CardDescription>

                  <div className="space-y-3">
                    <h4 className="flex items-center text-sm font-semibold">
                      <Sparkles className="mr-1 h-4 w-4" />
                      Key Features
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {tool.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {tool.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-100 text-xs text-slate-600"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {tool.tags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-xs text-slate-600"
                      >
                        +{tool.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Source Section */}
        <div className="space-y-6">
          <Card className="border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
            <CardContent className="p-8">
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center justify-center gap-2 space-x-3 md:flex-row md:gap-1">
                  <div className="rounded-full bg-slate-700 p-3">
                    <Github className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">
                    Open Source & Community
                  </h2>
                </div>

                <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-lg">
                  OpenSource Toolkit is built by developers, for developers.
                  Join our community and help us create the best collection of
                  developer utilities.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* GitHub */}
                  <Card className="border transition-colors hover:border-slate-600">
                    <CardContent className="space-y-4 p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-black dark:bg-white">
                        <Github className="h-6 w-6 text-white dark:text-black" />
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold">View Source Code</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Explore the codebase, report issues, and contribute to
                          the project on GitHub.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            window.open(
                              "https://github.com/truethari/OpensourceToolkit",
                              "_blank",
                            )
                          }
                        >
                          <Github className="mr-2 h-4 w-4" />
                          GitHub Repository
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contribute */}
                  <Card className="border transition-colors hover:border-slate-600">
                    <CardContent className="space-y-4 p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                        <GitFork className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold">Contribute</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Add new tools, fix bugs, improve documentation, or
                          suggest features.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            window.open(
                              "https://github.com/truethari/OpensourceToolkit/blob/master/CONTRIBUTING.md",
                              "_blank",
                            )
                          }
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          How to Contribute
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* License */}
                  <Card className="border transition-colors hover:border-slate-600">
                    <CardContent className="space-y-4 p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                        <Scale className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold">MIT License</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Free to use, modify, and distribute. Open source
                          software for everyone.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            window.open(
                              "https://github.com/truethari/OpensourceToolkit/blob/master/LICENSE",
                              "_blank",
                            )
                          }
                        >
                          <Scale className="mr-2 h-4 w-4" />
                          View License
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 border-t pt-6">
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Star className="h-3 w-3" />
                    <span>Star on GitHub</span>
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <GitFork className="h-3 w-3" />
                    <span>Fork & Contribute</span>
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Heart className="h-3 w-3" />
                    <span>Made with ❤️ by Community</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buy Me a Coffee */}
        <div className="flex justify-center py-8">
          <Button
            variant="outline"
            className="flex items-center space-x-2 border-yellow-300 bg-yellow-50 text-yellow-800 hover:border-yellow-400 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 dark:hover:bg-yellow-900"
            onClick={() => window.open("https://coff.ee/truethari", "_blank")}
          >
            <Coffee className="h-4 w-4" />
            <span>Buy me a coffee</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Footer */}
        <div className="rounded-lg border-t py-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">More Tools Coming Soon</h3>
            <p className="text-muted-foreground">
              We&apos;re constantly adding new developer utilities. Stay tuned
              for more powerful tools!
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <Palette className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-muted-foreground">
                Built with modern design principles
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
