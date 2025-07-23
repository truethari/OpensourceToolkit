import SQLFormatter from "@/components/tools/sql-formatter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("sql-formatter"),
  description: getDescription("sql-formatter"),
  keywords: getKeywords("sql-formatter"),
  openGraph: {
    title: getTitle("sql-formatter"),
    description: getDescription("sql-formatter"),
    type: "website",
    url: getHref("sql-formatter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "SQL Query Formatter & Validator - Format and Validate SQL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("sql-formatter"),
    description: getDescription("sql-formatter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <SQLFormatter />;
}
