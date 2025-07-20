import APITester from "@/components/tools/api-tester";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("api-tester"),
  description: getDescription("api-tester"),
  keywords: getKeywords("api-tester"),
  openGraph: {
    title: getTitle("api-tester"),
    description: getDescription("api-tester"),
    type: "website",
    url: getHref("api-tester"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "API Testing Tool - Professional REST API Client & Tester",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("api-tester"),
    description: getDescription("api-tester"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <APITester />;
}
