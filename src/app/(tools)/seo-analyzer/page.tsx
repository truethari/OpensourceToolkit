import SeoAnalyzer from "@/components/tools/seo-analyzer";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("seo-analyzer"),
  description: getDescription("seo-analyzer"),
  keywords: getKeywords("seo-analyzer"),
  openGraph: {
    title: getTitle("seo-analyzer"),
    description: getDescription("seo-analyzer"),
    type: "website",
    url: getHref("seo-analyzer"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Website SEO Analyzer - Audit Meta Tags and Social Previews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("seo-analyzer"),
    description: getDescription("seo-analyzer"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <SeoAnalyzer />;
}
