import EVMVanityGenerator from "@/components/tools/evm-vanity";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("evm-vanity"),
  description: getDescription("evm-vanity"),
  keywords: getKeywords("evm-vanity"),
  openGraph: {
    title: getTitle("evm-vanity"),
    description: getDescription("evm-vanity"),
    type: "website",
    url: getHref("evm-vanity"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "EVM Vanity Address Generator - Generate Custom Ethereum Addresses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("evm-vanity"),
    description: getDescription("evm-vanity"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <EVMVanityGenerator />;
}
