import UUID from "@/components/tools/uuid";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("uuid"),
  description: getDescription("uuid"),
  keywords: getKeywords("uuid"),
  openGraph: {
    title: getTitle("uuid"),
    description: getDescription("uuid"),
    type: "website",
    url: getHref("uuid"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "UUID Generator - Generate Unique Identifiers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("uuid"),
    description: getDescription("uuid"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <UUID />;
}
