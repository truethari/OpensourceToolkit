import UptimeMonitor from "@/components/tools/uptime-monitor";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("uptime-monitor"),
  description: getDescription("uptime-monitor"),
  keywords: getKeywords("uptime-monitor"),
  openGraph: {
    title: getTitle("uptime-monitor"),
    description: getDescription("uptime-monitor"),
    type: "website",
    url: getHref("uptime-monitor"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Uptime Monitor - Monitor Website Status & Performance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("uptime-monitor"),
    description: getDescription("uptime-monitor"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <UptimeMonitor />;
}
