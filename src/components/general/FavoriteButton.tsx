"use client";

import React from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useData } from "@/providers/DataProvider";

import type { ITool } from "@/types";

interface Props {
  tool: ITool;
  className?: string;
}

export default function FavoriteButton({ tool, className }: Props) {
  const { isFavoriteTool, toggleFavoriteTool } = useData();

  const isFavorite = isFavoriteTool(tool.id);

  const handleClick = (e: React.MouseEvent) => {
    // Cards are clickable — don't navigate when starring
    e.stopPropagation();
    e.preventDefault();

    toggleFavoriteTool(tool);

    toast.success(
      isFavorite
        ? `${tool.title} removed from favorites`
        : `${tool.title} added to favorites`,
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Remove ${tool.title} from favorites`
          : `Add ${tool.title} to favorites`
      }
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={cn("h-8 w-8 flex-shrink-0 p-0", className)}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-colors",
          isFavorite
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground hover:text-yellow-400",
        )}
      />
    </Button>
  );
}
