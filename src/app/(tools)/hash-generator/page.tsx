import HashGenerator from "@/components/tools/hash-generator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("hash-generator"),
  description: getDescription("hash-generator"),
  keywords: getKeywords("hash-generator"),
  openGraph: {
    title: getTitle("hash-generator"),
    description: getDescription("hash-generator"),
    type: "website",
    url: getHref("hash-generator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Hash Generator - MD5, SHA-256, SHA-512 Hash Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("hash-generator"),
    description: getDescription("hash-generator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function HashGeneratorPage() {
  return <HashGenerator />;
}
