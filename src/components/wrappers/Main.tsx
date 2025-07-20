"use client";

import React from "react";

import Sidebar from "@/components/general/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar />
      <main className="w-full">
        <SidebarTrigger className="md:hidden" />
        <div className="container w-full pt-2 md:pt-10">{children}</div>
      </main>
    </SidebarProvider>
  );
}
