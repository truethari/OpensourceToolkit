import HMACGeneratorComponent from "@/components/tools/hmac-generator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("hmac-generator"),
  description: getDescription("hmac-generator"),
  keywords: getKeywords("hmac-generator"),
  openGraph: {
    title: getTitle("hmac-generator"),
    description: getDescription("hmac-generator"),
    type: "website",
    url: getHref("hmac-generator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "HMAC Generator - Generate Hash-based Message Authentication Codes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("hmac-generator"),
    description: getDescription("hmac-generator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function HMACGeneratorPage() {
  return <HMACGeneratorComponent />;
}
