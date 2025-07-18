"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, ToolCase, Search, X } from "lucide-react";

import { tools } from "@/config";

import {
  Sidebar,
  SidebarMenu,
  SidebarGroup,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AppSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) {
      return tools;
    }

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

  const items = useMemo(() => {
    const home = {
      title: "Home",
      url: "/",
      icon: Home,
    };

    const more = filteredTools.map((tool) => ({
      title: tool.shortTitle,
      url: tool.href,
      icon: tool.icon,
    }));

    return [home, ...more];
  }, [filteredTools]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex h-16 items-center justify-center bg-blue-700 text-white">
          <ToolCase className="mr-2 h-8 w-8" />
          <span className="text-lg font-semibold">OpenSource Toolkit</span>
        </div>

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

        <SidebarGroup>
          <SidebarGroupLabel>
            {searchQuery ? `Results (${filteredTools.length + 1})` : "Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.length === 1 && searchQuery ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No tools found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={
                          item.url === pathname
                            ? "bg-blue-700 hover:bg-blue-600"
                            : ""
                        }
                        prefetch={true}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
