import Timestamp from "@/components/tools/timestamp";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("timestamp"),
  description: getDescription("timestamp"),
  keywords: getKeywords("timestamp"),
  openGraph: {
    title: getTitle("timestamp"),
    description: getDescription("timestamp"),
    type: "website",
    url: getHref("timestamp"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Timestamp Converter - Convert and Generate Timestamps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("timestamp"),
    description: getDescription("timestamp"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <Timestamp />;
}
