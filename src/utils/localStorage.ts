import type { ITool } from "@/types";

export interface IRecentTool {
  id: string;
  title: string;
  href: string;
  color: string;
  lastUsed: string;
}

const RECENT_TOOLS_KEY = "opensourcetoolkit_recent_tools";
const MAX_RECENT_TOOLS = 9;

export const localStorage = {
  // Get recent tools from localStorage
  getRecentTools: (): IRecentTool[] => {
    try {
      if (typeof window === "undefined") return [];

      const stored = window.localStorage.getItem(RECENT_TOOLS_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error getting recent tools from localStorage:", error);
      return [];
    }
  },

  // Add a tool to recent tools
  addRecentTool: (tool: ITool): void => {
    try {
      if (typeof window === "undefined") return;

      const existingTools = localStorage.getRecentTools();

      // Remove if already exists
      const filteredTools = existingTools.filter((t) => t.id !== tool.id);

      // Add to beginning
      const newTool: IRecentTool = {
        id: tool.id,
        title: tool.title,
        href: tool.href,
        color: tool.color,
        lastUsed: new Date().toISOString(),
      };

      const updatedTools = [newTool, ...filteredTools].slice(
        0,
        MAX_RECENT_TOOLS,
      );

      window.localStorage.setItem(
        RECENT_TOOLS_KEY,
        JSON.stringify(updatedTools),
      );
    } catch (error) {
      console.error("Error adding recent tool to localStorage:", error);
    }
  },

  // Clear all recent tools
  clearRecentTools: (): void => {
    try {
      if (typeof window === "undefined") return;

      window.localStorage.removeItem(RECENT_TOOLS_KEY);
    } catch (error) {
      console.error("Error clearing recent tools from localStorage:", error);
    }
  },

  // Get recent tool IDs only
  getRecentToolIds: (): string[] => {
    return localStorage.getRecentTools().map((tool) => tool.id);
  },

  // Check if a tool is recently used
  isRecentTool: (toolId: string): boolean => {
    return localStorage.getRecentToolIds().includes(toolId);
  },

  // Get recent tools count
  getRecentToolsCount: (): number => {
    return localStorage.getRecentTools().length;
  },

  // Remove a specific tool from recent tools
  removeRecentTool: (toolId: string): void => {
    try {
      if (typeof window === "undefined") return;

      const existingTools = localStorage.getRecentTools();
      const filteredTools = existingTools.filter((t) => t.id !== toolId);

      window.localStorage.setItem(
        RECENT_TOOLS_KEY,
        JSON.stringify(filteredTools),
      );
    } catch (error) {
      console.error("Error removing recent tool from localStorage:", error);
    }
  },
};
