import NextJsImageDecoder from "@/components/tools/nextjs-image-decoder";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("nextjs-image-decoder"),
  description: getDescription("nextjs-image-decoder"),
  keywords: getKeywords("nextjs-image-decoder"),
  openGraph: {
    title: getTitle("nextjs-image-decoder"),
    description: getDescription("nextjs-image-decoder"),
    type: "website",
    url: getHref("nextjs-image-decoder"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Next.js Image URL Decoder - Extract & Generate Optimized Image URLs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("nextjs-image-decoder"),
    description: getDescription("nextjs-image-decoder"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <NextJsImageDecoder />;
}
