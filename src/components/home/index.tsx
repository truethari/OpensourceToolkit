"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo, useCallback } from "react";
import {
  Star,
  Search,
  Sparkles,
  Bookmark,
  ArrowRight,
  Plus,
  Code,
  Heart,
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

import Hero from "./Hero";
import QuickActions from "./QuickActions";
import Footer from "@/components/general/Footer";

import { tools } from "@/config";
import { useData } from "@/providers/DataProvider";
import { useNavigation } from "@/providers/NavigationProvider";

import type { ITool } from "@/types";

export default function Home() {
  const router = useRouter();
  const { recentTools, addRecentTool } = useData();
  const { startNavigation, stopNavigation } = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");

  interface ICategory {
    name: string;
    count: number;
  }

  const categories: ICategory[] = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    tools.forEach((tool) => {
      if (!categoryMap[tool.category]) categoryMap[tool.category] = 0;
      categoryMap[tool.category]++;
    });

    const result = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));

    return [{ name: "All Tools", count: tools.length }, ...result];
  }, []);

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
      startNavigation();
      addRecentTool(tool);
      router.push(tool.href);

      // Stop navigation after a brief delay (the progress bar will complete automatically)
      setTimeout(() => {
        stopNavigation();
      }, 500);
    },
    [addRecentTool, router, startNavigation, stopNavigation],
  );

  const quickActions = useMemo(() => {
    const allPopularTools = tools.filter((tool) => tool.popular);
    // get random 4 popular tools
    const randomPopularTools = allPopularTools
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
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
                        className="md:text-md h-auto p-2 text-xs transition-colors hover:border-slate-600 hover:bg-slate-900 md:text-sm"
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
                    className="cursor-pointer px-4 py-2 text-xs transition-colors hover:border-slate-600 hover:bg-slate-900 md:text-sm"
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

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-6">
            {filteredTools.map((tool) => (
              <Card
                key={tool.id}
                className="group cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:border-slate-600 hover:shadow-lg"
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full space-x-3">
                      <div
                        className={`p-3 ${tool.color} h-fit rounded-xl border`}
                      >
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>

                      <div className="w-full">
                        <CardTitle className="flex w-full items-center justify-between space-x-2 md:justify-start">
                          <span className="leading-normal">{tool.title}</span>
                          <div className="flex flex-col">
                            {tool.popular && (
                              <Badge
                                variant="secondary"
                                className="w-fit bg-slate-800 text-slate-300"
                              >
                                <Star className="mr-1 h-3 w-3" />
                                Popular
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="mt-1 block w-fit text-nowrap text-xs md:hidden"
                            >
                              {tool.category}
                            </Badge>
                          </div>
                        </CardTitle>

                        <Badge
                          variant="outline"
                          className="mt-1 hidden w-fit text-xs md:block"
                        >
                          {tool.category}
                        </Badge>
                      </div>
                    </div>

                    <ArrowRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 md:block" />
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
                    <ul className="grid list-outside list-disc grid-cols-1 gap-1 pl-4 text-sm text-muted-foreground marker:text-blue-500 md:grid-cols-2">
                      {tool.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
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

            {/* Contribute Card */}
            <Card
              className="group mt-1 cursor-pointer border-2 border-dashed border-blue-600 bg-gradient-to-br from-blue-950/30 to-purple-950/20 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500 hover:from-blue-900/40 hover:to-purple-900/40 hover:shadow-lg md:mt-0"
              onClick={() => {
                startNavigation();
                router.push("/contribute-guide");
                setTimeout(() => stopNavigation(), 500);
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex w-full space-x-3">
                    <div className="h-fit rounded-xl border border-blue-400 bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg">
                      <Plus className="h-6 w-6 text-white" />
                    </div>

                    <div className="w-full">
                      <CardTitle className="flex w-full items-center justify-between space-x-2 md:justify-start">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold leading-normal text-transparent">
                          Add Your Tool
                        </span>
                        <div className="flex flex-col">
                          <Badge
                            variant="secondary"
                            className="w-fit bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            <Heart className="mr-1 h-3 w-3" />
                            Contribute
                          </Badge>
                          <Badge
                            variant="outline"
                            className="mt-1 block w-fit text-nowrap border-blue-300 text-xs text-blue-600 dark:border-blue-600 dark:text-blue-400 md:hidden"
                          >
                            Open Source
                          </Badge>
                        </div>
                      </CardTitle>

                      <Badge
                        variant="outline"
                        className="mt-1 hidden w-fit border-blue-300 text-xs text-blue-600 dark:border-blue-600 dark:text-blue-400 md:block"
                      >
                        Open Source
                      </Badge>
                    </div>
                  </div>

                  <ArrowRight className="hidden h-5 w-5 text-blue-500 transition-transform group-hover:translate-x-1 md:block" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="md:text-md text-sm leading-relaxed text-blue-700 dark:text-blue-300">
                  Have an amazing tool idea? Join our community and help
                  developers worldwide by contributing your own tool to
                  OpensourceToolkit!
                </CardDescription>

                <div className="space-y-3">
                  <h4 className="flex items-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                    <Code className="mr-1 h-4 w-4" />
                    Why Contribute?
                  </h4>
                  <ul className="grid list-outside list-disc grid-cols-1 gap-1 pl-4 text-sm text-blue-600 marker:text-blue-500 dark:text-blue-400 md:grid-cols-2">
                    <li>Help developers globally</li>
                    <li>Build your portfolio</li>
                    <li>Learn modern tech</li>
                    <li>Join the community</li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  >
                    TypeScript
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  >
                    React
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                  >
                    Next.js
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Footer showDonations={true} />
      </div>
    </div>
  );
}
