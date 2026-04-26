import TextAnalyzer from "@/components/tools/text-analyzer";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("text-analyzer"),
  description: getDescription("text-analyzer"),
  keywords: getKeywords("text-analyzer"),
  openGraph: {
    title: getTitle("text-analyzer"),
    description: getDescription("text-analyzer"),
    type: "website",
    url: getHref("text-analyzer"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Text Analyzer - Word Count, Case Conversion & Text Statistics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("text-analyzer"),
    description: getDescription("text-analyzer"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <TextAnalyzer />;
}
