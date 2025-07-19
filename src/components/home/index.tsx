"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo, useCallback } from "react";
import { Star, Search, Sparkles, Bookmark, ArrowRight } from "lucide-react";

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

import Hero from "./Hero";
import Footer from "./Footer";
import QuickActions from "./QuickActions";

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
      <Hero />

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

        {searchQuery.length === 0 && (
          <>
            <QuickActions quickActions={quickActions} />

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
          </>
        )}

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

        <Footer />
      </div>
    </div>
  );
}
