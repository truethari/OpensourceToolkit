import AsciiGenerator from "@/components/tools/ascii-generator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("ascii-generator"),
  description: getDescription("ascii-generator"),
  keywords: getKeywords("ascii-generator"),
  openGraph: {
    title: getTitle("ascii-generator"),
    description: getDescription("ascii-generator"),
    type: "website",
    url: getHref("ascii-generator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "ASCII Art Generator - Convert Text and Images to ASCII Art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("ascii-generator"),
    description: getDescription("ascii-generator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <AsciiGenerator />;
}
