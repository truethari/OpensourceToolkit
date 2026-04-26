import AdvancedSearch from "@/components/tools/advanced-search";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("advanced-search"),
  description: getDescription("advanced-search"),
  keywords: getKeywords("advanced-search"),
  openGraph: {
    title: getTitle("advanced-search"),
    description: getDescription("advanced-search"),
    type: "website",
    url: getHref("advanced-search"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Advanced Search Builder - Google & YouTube Search Operators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("advanced-search"),
    description: getDescription("advanced-search"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <AdvancedSearch />;
}
