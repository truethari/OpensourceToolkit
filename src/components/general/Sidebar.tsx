"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, ToolCase, Search, X, PlusSquare, Star } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressLink } from "@/components/ui/progress-link";

import { cn } from "@/lib/utils";
import { tools } from "@/config";
import { useData } from "@/providers/DataProvider";

import type { ITool } from "@/types";

import {
  Sidebar,
  SidebarMenu,
  SidebarGroup,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AppSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const { favoriteTools, isFavoriteTool, toggleFavoriteTool } = useData();

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;

    const query = searchQuery.toLowerCase();
    return tools.filter((tool) => {
      return (
        tool.title.toLowerCase().includes(query) ||
        tool.shortTitle.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        tool.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  interface IToolItem {
    title: string;
    url: string;
    icon: React.ComponentType;
    tool: ITool;
  }

  const categorizedTools: Record<string, IToolItem[]> = useMemo(() => {
    const result = filteredTools.reduce(
      (acc, tool) => {
        const category = tool.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          title: tool.shortTitle,
          url: tool.href,
          icon: tool.icon,
          tool,
        });
        return acc;
      },
      {} as Record<string, IToolItem[]>,
    );

    // sort each category's tools alphabetically by title
    Object.keys(result).forEach((category) => {
      result[category].sort((a, b) => a.title.localeCompare(b.title));
    });

    // sort categories alphabetically
    return Object.fromEntries(
      Object.entries(result).sort(([a], [b]) => a.localeCompare(b)),
    );
  }, [filteredTools]);

  const favoriteToolItems: IToolItem[] = useMemo(() => {
    return favoriteTools
      .map((favorite) => tools.find((tool) => tool.id === favorite.id))
      .filter((tool): tool is ITool => Boolean(tool))
      .map((tool) => ({
        title: tool.shortTitle,
        url: tool.href,
        icon: tool.icon,
        tool,
      }));
  }, [favoriteTools]);

  const clearSearch = () => setSearchQuery("");

  const renderToolItem = (item: IToolItem) => {
    const favorite = isFavoriteTool(item.tool.id);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <ProgressLink
            href={item.url}
            className={cn(
              "pr-8",
              item.url === pathname ? "bg-blue-700 hover:bg-blue-600" : "",
            )}
          >
            <item.icon />
            <span className="truncate">{item.title}</span>
          </ProgressLink>
        </SidebarMenuButton>
        <SidebarMenuAction
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavoriteTool(item.tool);
          }}
          aria-label={
            favorite
              ? `Remove ${item.tool.title} from favorites`
              : `Add ${item.tool.title} to favorites`
          }
          title={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              "h-4 w-4",
              favorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400",
            )}
          />
        </SidebarMenuAction>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      <SidebarContent className="flex flex-col">
        <ProgressLink
          href="/"
          className="flex h-16 flex-shrink-0 cursor-pointer items-center justify-center bg-blue-700 text-white"
        >
          <ToolCase className="mr-2 h-8 w-8" />
          <span className="text-lg font-semibold">OpenSource Toolkit</span>
        </ProgressLink>

        <ScrollArea>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <ProgressLink
                      href="/"
                      className={
                        pathname === "/" ? "bg-blue-700 hover:bg-blue-600" : ""
                      }
                    >
                      <Home />
                      <span>Home</span>
                    </ProgressLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Search Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8"
                  autoFocus={false}
                  tabIndex={-1}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {favoriteToolItems.length > 0 && !searchQuery.trim() && (
            <SidebarGroup>
              <SidebarGroupLabel>Favorites</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {favoriteToolItems.map(renderToolItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {Object.entries(categorizedTools).map(([category, tools]) => (
            <SidebarGroup key={category}>
              <SidebarGroupLabel>{category}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{tools.map(renderToolItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <ProgressLink
                      href="/contribute-guide"
                      className={
                        pathname === "/contribute-guide"
                          ? "bg-gradient-to-br from-blue-950 to-purple-950"
                          : "border border-dashed border-gray-700 hover:bg-gray-600"
                      }
                    >
                      <PlusSquare />
                      <span>Add new tool</span>
                    </ProgressLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
