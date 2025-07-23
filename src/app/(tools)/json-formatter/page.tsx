import JSONFormatter from "@/components/tools/json-formatter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("json-formatter"),
  description: getDescription("json-formatter"),
  keywords: getKeywords("json-formatter"),
  openGraph: {
    title: getTitle("json-formatter"),
    description: getDescription("json-formatter"),
    type: "website",
    url: getHref("json-formatter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "JSON/XML/YAML Formatter & Validator - Format and Validate Data",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("json-formatter"),
    description: getDescription("json-formatter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <JSONFormatter />;
}
