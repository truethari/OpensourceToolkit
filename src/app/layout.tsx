import "./globals.css";

import React from "react";
import { Poppins } from "next/font/google";

import MainLayout from "@/components/wrappers/Main";
import QueryProvider from "@/providers/QueryProvider";

import type { Metadata } from "next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "OpenSource Toolkit",
  description:
    "Open source collection of useful daily utilities. Built by the community for developers and users. Contribute your own tools and components.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} dark antialiased`}>
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
