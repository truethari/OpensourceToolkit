import BlockchainBalance from "@/components/tools/blockchain-balance";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("blockchain-balance"),
  description: getDescription("blockchain-balance"),
  keywords: getKeywords("blockchain-balance"),
  openGraph: {
    title: getTitle("blockchain-balance"),
    description: getDescription("blockchain-balance"),
    type: "website",
    url: getHref("blockchain-balance"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Blockchain Balance - Multi-Chain Balance Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("blockchain-balance"),
    description: getDescription("blockchain-balance"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <BlockchainBalance />;
}
