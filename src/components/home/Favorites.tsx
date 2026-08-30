"use client";

import React from "react";
import { Star, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { tools } from "@/config";
import { useData } from "@/providers/DataProvider";

import type { ITool } from "@/types";

interface Props {
  onToolClick: (tool: ITool) => void;
}

export default function Favorites({ onToolClick }: Props) {
  const { favoriteTools, toggleFavoriteTool } = useData();

  const resolvedTools = favoriteTools
    .map((favorite) => tools.find((tool) => tool.id === favorite.id))
    .filter((tool): tool is ITool => Boolean(tool));

  if (resolvedTools.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <h2 className="text-2xl font-bold">Your Favorites</h2>
        <Badge variant="secondary" className="text-slate-300">
          <Star className="mr-1 h-3 w-3 fill-current" />
          {resolvedTools.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {resolvedTools.map((tool) => (
          <Card
            key={tool.id}
            className="cursor-pointer border transition-all duration-300 hover:border-slate-600 hover:bg-slate-900 hover:shadow-md"
            onClick={() => onToolClick(tool)}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-4">
                <div className={`rounded-xl ${tool.color} border p-3`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold">
                    {tool.title}
                  </h3>
                  <p className="md:text-md line-clamp-2 text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${tool.title} from favorites`}
                  title="Remove from favorites"
                  className="h-8 w-8 flex-shrink-0 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteTool(tool);
                  }}
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </Button>
                <ArrowRight className="hidden h-5 w-5 text-muted-foreground md:block" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
