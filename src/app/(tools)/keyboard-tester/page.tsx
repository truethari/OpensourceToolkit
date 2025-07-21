import KeyboardTester from "@/components/tools/keyboard";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("keyboard-tester"),
  description: getDescription("keyboard-tester"),
  keywords: getKeywords("keyboard-tester"),
  openGraph: {
    title: getTitle("keyboard-tester"),
    description: getDescription("keyboard-tester"),
    type: "website",
    url: getHref("keyboard-tester"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Keyboard Tester - Test Keys, Typing Speed & Response Times",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("keyboard-tester"),
    description: getDescription("keyboard-tester"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <KeyboardTester />;
}
