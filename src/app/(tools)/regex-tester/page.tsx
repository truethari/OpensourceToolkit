import RegexTester from "@/components/tools/regex-tester";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("regex-tester"),
  description: getDescription("regex-tester"),
  keywords: getKeywords("regex-tester"),
  openGraph: {
    title: getTitle("regex-tester"),
    description: getDescription("regex-tester"),
    type: "website",
    url: getHref("regex-tester"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Regular Expression Tester & Builder - Test and Debug Regex",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("regex-tester"),
    description: getDescription("regex-tester"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <RegexTester />;
}
