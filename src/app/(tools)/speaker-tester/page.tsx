import SpeakerTester from "@/components/tools/speaker-tester";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("speaker-tester"),
  description: getDescription("speaker-tester"),
  keywords: getKeywords("speaker-tester"),
  openGraph: {
    title: getTitle("speaker-tester"),
    description: getDescription("speaker-tester"),
    type: "website",
    url: getHref("speaker-tester"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Speaker Testing Tool - Test Audio Systems & Surround Sound",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("speaker-tester"),
    description: getDescription("speaker-tester"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <SpeakerTester />;
}
