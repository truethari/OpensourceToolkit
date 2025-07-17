"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Home, ToolCase } from "lucide-react";

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

export default function AppSidebar() {
  const pathname = usePathname();

  const items = useMemo(() => {
    const home = {
      title: "Home",
      url: "/",
      icon: Home,
    };

    const more = tools.map((tool) => ({
      title: tool.shortTitle,
      url: tool.href,
      icon: tool.icon,
    }));

    return [home, ...more];
  }, []);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex h-16 items-center justify-center bg-green-700 text-white">
          <ToolCase className="mr-2 h-8 w-8" />
          <span className="text-lg font-semibold">OpenSource Toolkit</span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={item.url === pathname ? "bg-green-700" : ""}
                      prefetch={true}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
