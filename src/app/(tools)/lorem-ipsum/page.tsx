import LoremIpsumGenerator from "@/components/tools/lorem-ipsum";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("lorem-ipsum"),
  description: getDescription("lorem-ipsum"),
  keywords: getKeywords("lorem-ipsum"),
  openGraph: {
    title: getTitle("lorem-ipsum"),
    description: getDescription("lorem-ipsum"),
    type: "website",
    url: getHref("lorem-ipsum"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Lorem Ipsum Generator - Generate Placeholder Text",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("lorem-ipsum"),
    description: getDescription("lorem-ipsum"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <LoremIpsumGenerator />;
}
