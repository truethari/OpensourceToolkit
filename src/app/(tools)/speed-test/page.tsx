import SpeedTest from "@/components/tools/speed-test";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("speed-test"),
  description: getDescription("speed-test"),
  keywords: getKeywords("speed-test"),
  openGraph: {
    title: getTitle("speed-test"),
    description: getDescription("speed-test"),
    type: "website",
    url: getHref("speed-test"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Internet Speed Test - Test Your Connection Speed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("speed-test"),
    description: getDescription("speed-test"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <SpeedTest />;
}
