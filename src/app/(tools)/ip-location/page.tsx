import IPLocation from "@/components/tools/ip-location";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("ip-location"),
  description: getDescription("ip-location"),
  keywords: getKeywords("ip-location"),
  openGraph: {
    title: getTitle("ip-location"),
    description: getDescription("ip-location"),
    type: "website",
    url: getHref("ip-location"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "IP Location Checker - Find IP Address Geolocation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("ip-location"),
    description: getDescription("ip-location"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <IPLocation />;
}
