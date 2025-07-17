"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo } from "react";
import {
  Star,
  Code,
  Users,
  Search,
  Palette,
  Sparkles,
  Bookmark,
  ArrowRight,
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

import type { ITool } from "@/types";

export default function Home() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyUsed, setRecentlyUsed] = useState(["uuid", "timestamp"]);

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

  const handleToolClick = (tool: ITool) => {
    // Update recently used
    setRecentlyUsed((prev) => {
      const updated = [tool.id, ...prev.filter((id) => id !== tool.id)].slice(
        0,
        3,
      );
      return updated;
    });

    router.push(tool.href);
  };

  const quickActions = useMemo(() => {
    return tools.slice(0, 2).map((tool) => ({
      title: `Quick ${tool.title}`,
      description: tool.description,
      action: () => handleToolClick(tool),
      icon: tool.icon,
    }));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Hero Section */}
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="space-y-6 text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
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

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Search Bar */}
        <Card className="border shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search tools, features, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 border-slate-700 pl-12 text-lg focus-visible:ring-2 focus-visible:ring-slate-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer border transition-all duration-300 hover:border-slate-600 hover:shadow-md"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-xl border bg-slate-700 p-3">
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="text-muted-foreground">
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
        {recentlyUsed.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold">Recently Used</h2>
              <Badge variant="secondary" className="text-slate-300">
                <Bookmark className="mr-1 h-3 w-3" />
                Quick Access
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {recentlyUsed.map((toolId) => {
                const tool = tools.find((t) => t.id === toolId);
                if (!tool) return null;
                return (
                  <Button
                    key={toolId}
                    variant="outline"
                    onClick={() => handleToolClick(tool)}
                    className="h-auto p-4 transition-colors hover:border-slate-600 hover:bg-slate-800"
                  >
                    <tool.icon className="mr-2 h-4 w-4" />
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
                className="cursor-pointer px-4 py-2 text-sm transition-colors hover:border-slate-600 hover:bg-slate-800"
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
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-3 ${tool.color} rounded-xl border transition-transform group-hover:scale-110`}
                      >
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{tool.title}</span>
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
                  <CardDescription className="text-base leading-relaxed">
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
