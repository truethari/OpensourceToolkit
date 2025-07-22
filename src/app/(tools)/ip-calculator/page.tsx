import IPCalculator from "@/components/tools/ip-calculator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("ip-calculator"),
  description: getDescription("ip-calculator"),
  keywords: getKeywords("ip-calculator"),
  openGraph: {
    title: getTitle("ip-calculator"),
    description: getDescription("ip-calculator"),
    type: "website",
    url: getHref("ip-calculator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "IP Address Calculator - Subnet Calculator and Network Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("ip-calculator"),
    description: getDescription("ip-calculator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <IPCalculator />;
}
