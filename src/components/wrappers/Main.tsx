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
        <SidebarTrigger />
        <div className="container w-full">{children}</div>
      </main>
    </SidebarProvider>
  );
}
