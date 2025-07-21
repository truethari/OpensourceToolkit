"use client";

import React from "react";

import Sidebar from "@/components/general/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavigationProgressBar } from "@/components/ui/progress-bar";
import { useNavigationEvents } from "@/hooks/useNavigationEvents";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle navigation events globally
  useNavigationEvents();

  return (
    <SidebarProvider>
      <NavigationProgressBar />
      <Sidebar />
      <main className="w-full">
        <SidebarTrigger className="md:hidden" />
        <div className="container w-full pt-2 md:pt-10">{children}</div>
      </main>
    </SidebarProvider>
  );
}
