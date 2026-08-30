"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import FavoritesNoticeDialog from "@/components/general/FavoritesNoticeDialog";

import { tools } from "@/config";
import {
  favorites,
  localStorage,
  IRecentTool,
  IFavoriteTool,
} from "@/utils/localStorage";

import type { ITool } from "@/types";

interface DataContextType {
  recentTools: IRecentTool[];
  addRecentTool: (tool: ITool) => void;
  clearRecentTools: () => void;
  removeRecentTool: (toolId: string) => void;
  isRecentTool: (toolId: string) => boolean;
  favoriteTools: IFavoriteTool[];
  toggleFavoriteTool: (tool: ITool) => void;
  clearFavoriteTools: () => void;
  isFavoriteTool: (toolId: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export default function DataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recentTools, setRecentTools] = useState<IRecentTool[]>([]);
  const [favoriteTools, setFavoriteTools] = useState<IFavoriteTool[]>([]);
  const [showFavoritesNotice, setShowFavoritesNotice] = useState(false);
  const pathname = usePathname();

  // Initialize recent tools from localStorage
  useEffect(() => {
    const storedRecentTools = localStorage.getRecentTools();
    setRecentTools(storedRecentTools);
  }, []);

  // Initialize favorite tools from localStorage
  useEffect(() => {
    setFavoriteTools(favorites.getFavoriteTools());
  }, []);

  // Track path changes and add to recent tools
  useEffect(() => {
    if (pathname === "/" || pathname === "") return;

    // Find the tool based on the current path
    const currentTool = tools.find((tool) => tool.href === pathname);

    if (currentTool) {
      // Add to recent tools
      localStorage.addRecentTool(currentTool);

      // Update state
      const updatedRecentTools = localStorage.getRecentTools();
      setRecentTools(updatedRecentTools);
    }
  }, [pathname]);

  const addRecentTool = (tool: ITool) => {
    localStorage.addRecentTool(tool);
    const updatedRecentTools = localStorage.getRecentTools();
    setRecentTools(updatedRecentTools);
  };

  const clearRecentTools = () => {
    localStorage.clearRecentTools();
    setRecentTools([]);
  };

  const removeRecentTool = (toolId: string) => {
    localStorage.removeRecentTool(toolId);
    const updatedRecentTools = localStorage.getRecentTools();
    setRecentTools(updatedRecentTools);
  };

  const isRecentTool = (toolId: string): boolean => {
    return recentTools.some((tool) => tool.id === toolId);
  };

  const toggleFavoriteTool = (tool: ITool) => {
    const alreadyFavorite = favoriteTools.some((t) => t.id === tool.id);

    if (alreadyFavorite) {
      favorites.removeFavoriteTool(tool.id);
    } else {
      favorites.addFavoriteTool(tool);

      // Explain where favorites live the first time one is saved
      if (!favorites.hasSeenNotice()) {
        favorites.markNoticeSeen();
        setShowFavoritesNotice(true);
      }
    }

    setFavoriteTools(favorites.getFavoriteTools());
  };

  const clearFavoriteTools = () => {
    favorites.clearFavoriteTools();
    setFavoriteTools([]);
  };

  const isFavoriteTool = (toolId: string): boolean => {
    return favoriteTools.some((tool) => tool.id === toolId);
  };

  const contextValue: DataContextType = {
    recentTools,
    addRecentTool,
    clearRecentTools,
    removeRecentTool,
    isRecentTool,
    favoriteTools,
    toggleFavoriteTool,
    clearFavoriteTools,
    isFavoriteTool,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
      <FavoritesNoticeDialog
        open={showFavoritesNotice}
        onOpenChange={setShowFavoritesNotice}
      />
      <Toaster />
    </DataContext.Provider>
  );
}
