"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";

import { tools } from "@/config";
import { localStorage, IRecentTool } from "@/utils/localStorage";

import type { ITool } from "@/types";

interface DataContextType {
  recentTools: IRecentTool[];
  addRecentTool: (tool: ITool) => void;
  clearRecentTools: () => void;
  removeRecentTool: (toolId: string) => void;
  isRecentTool: (toolId: string) => boolean;
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
  const pathname = usePathname();

  // Initialize recent tools from localStorage
  useEffect(() => {
    const storedRecentTools = localStorage.getRecentTools();
    setRecentTools(storedRecentTools);
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

  const contextValue: DataContextType = {
    recentTools,
    addRecentTool,
    clearRecentTools,
    removeRecentTool,
    isRecentTool,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
      <Toaster />
    </DataContext.Provider>
  );
}
