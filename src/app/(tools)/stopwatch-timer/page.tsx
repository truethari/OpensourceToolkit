import StopwatchTimer from "@/components/tools/stopwatch-timer";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("stopwatch-timer"),
  description: getDescription("stopwatch-timer"),
  keywords: getKeywords("stopwatch-timer"),
  openGraph: {
    title: getTitle("stopwatch-timer"),
    description: getDescription("stopwatch-timer"),
    type: "website",
    url: getHref("stopwatch-timer"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Stopwatch & Timer - Professional Time Management Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("stopwatch-timer"),
    description: getDescription("stopwatch-timer"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <StopwatchTimer />;
}
