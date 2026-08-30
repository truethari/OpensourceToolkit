import type { ITool } from "@/types";

export interface IRecentTool {
  id: string;
  title: string;
  href: string;
  color: string;
  lastUsed: string;
}

const RECENT_TOOLS_KEY = "opensourcetoolkit_recent_tools";
const MAX_RECENT_TOOLS = 5;

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

export interface IFavoriteTool {
  id: string;
  title: string;
  href: string;
  color: string;
  addedAt: string;
}

const FAVORITE_TOOLS_KEY = "opensourcetoolkit_favorite_tools";
const FAVORITES_NOTICE_KEY = "opensourcetoolkit_favorites_notice_seen";

export const favorites = {
  // Get favorite tools from localStorage
  getFavoriteTools: (): IFavoriteTool[] => {
    try {
      if (typeof window === "undefined") return [];

      const stored = window.localStorage.getItem(FAVORITE_TOOLS_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error getting favorite tools from localStorage:", error);
      return [];
    }
  },

  // Add a tool to favorites
  addFavoriteTool: (tool: ITool): void => {
    try {
      if (typeof window === "undefined") return;

      const existingTools = favorites.getFavoriteTools();
      if (existingTools.some((t) => t.id === tool.id)) return;

      const newTool: IFavoriteTool = {
        id: tool.id,
        title: tool.title,
        href: tool.href,
        color: tool.color,
        addedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(
        FAVORITE_TOOLS_KEY,
        JSON.stringify([...existingTools, newTool]),
      );
    } catch (error) {
      console.error("Error adding favorite tool to localStorage:", error);
    }
  },

  // Remove a specific tool from favorites
  removeFavoriteTool: (toolId: string): void => {
    try {
      if (typeof window === "undefined") return;

      const filteredTools = favorites
        .getFavoriteTools()
        .filter((t) => t.id !== toolId);

      window.localStorage.setItem(
        FAVORITE_TOOLS_KEY,
        JSON.stringify(filteredTools),
      );
    } catch (error) {
      console.error("Error removing favorite tool from localStorage:", error);
    }
  },

  // Clear all favorite tools
  clearFavoriteTools: (): void => {
    try {
      if (typeof window === "undefined") return;

      window.localStorage.removeItem(FAVORITE_TOOLS_KEY);
    } catch (error) {
      console.error("Error clearing favorite tools from localStorage:", error);
    }
  },

  // Check if a tool is favorited
  isFavoriteTool: (toolId: string): boolean => {
    return favorites.getFavoriteTools().some((tool) => tool.id === toolId);
  },

  // Whether the local-storage notice has already been shown
  hasSeenNotice: (): boolean => {
    try {
      if (typeof window === "undefined") return true;

      return window.localStorage.getItem(FAVORITES_NOTICE_KEY) === "true";
    } catch (error) {
      console.error("Error reading favorites notice from localStorage:", error);
      return true;
    }
  },

  // Mark the local-storage notice as shown
  markNoticeSeen: (): void => {
    try {
      if (typeof window === "undefined") return;

      window.localStorage.setItem(FAVORITES_NOTICE_KEY, "true");
    } catch (error) {
      console.error("Error saving favorites notice to localStorage:", error);
    }
  },
};
