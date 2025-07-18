import DNSLookupTool from "@/components/tools/dns-lookup";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("dns-lookup"),
  description: getDescription("dns-lookup"),
  keywords: getKeywords("dns-lookup"),
  openGraph: {
    title: getTitle("dns-lookup"),
    description: getDescription("dns-lookup"),
    type: "website",
    url: getHref("dns-lookup"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "DNS Lookup Tool - Query Domain Name System Records",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("dns-lookup"),
    description: getDescription("dns-lookup"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <DNSLookupTool />;
}
