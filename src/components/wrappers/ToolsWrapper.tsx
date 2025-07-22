"use client";

import React from "react";
import Footer from "@/components/general/Footer";

export default function ToolsWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {children}

      <div className="pb-6 pt-10">
        <Footer />
      </div>
    </div>
  );
}
