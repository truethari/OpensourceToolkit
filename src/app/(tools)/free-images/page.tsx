import FreeImages from "@/components/tools/free-images";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("free-images"),
  description: getDescription("free-images"),
  keywords: getKeywords("free-images"),
  openGraph: {
    title: getTitle("free-images"),
    description: getDescription("free-images"),
    type: "website",
    url: getHref("free-images"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Free Images Collection - High-Quality Stock Photos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("free-images"),
    description: getDescription("free-images"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <FreeImages />;
}
