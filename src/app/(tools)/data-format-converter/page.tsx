import DataFormatConverter from "@/components/tools/data-format-converter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("data-format-converter"),
  description: getDescription("data-format-converter"),
  keywords: getKeywords("data-format-converter"),
  openGraph: {
    title: getTitle("data-format-converter"),
    description: getDescription("data-format-converter"),
    type: "website",
    url: getHref("data-format-converter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "YAML JSON TOML Converter - Convert Between Config Formats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("data-format-converter"),
    description: getDescription("data-format-converter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <DataFormatConverter />;
}
