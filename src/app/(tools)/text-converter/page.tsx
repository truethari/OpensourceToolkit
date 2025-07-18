import TextCaseConverter from "@/components/tools/text-converter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("text-case-converter"),
  description: getDescription("text-case-converter"),
  keywords: getKeywords("text-case-converter"),
  openGraph: {
    title: getTitle("text-case-converter"),
    description: getDescription("text-case-converter"),
    type: "website",
    url: getHref("text-case-converter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Text Case Converter - Convert Text Between Different Cases",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("text-case-converter"),
    description: getDescription("text-case-converter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <TextCaseConverter />;
}
