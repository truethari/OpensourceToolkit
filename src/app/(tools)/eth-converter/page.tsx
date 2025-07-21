import EthConverter from "@/components/tools/eth-converter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("eth-converter"),
  description: getDescription("eth-converter"),
  keywords: getKeywords("eth-converter"),
  openGraph: {
    title: getTitle("eth-converter"),
    description: getDescription("eth-converter"),
    type: "website",
    url: getHref("eth-converter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "ETH Wei Gwei Converter - Ethereum Unit Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("eth-converter"),
    description: getDescription("eth-converter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <EthConverter />;
}
