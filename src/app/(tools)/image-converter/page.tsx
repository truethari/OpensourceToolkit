import ImageConverter from "@/components/tools/image-converter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("image-format-converter"),
  description: getDescription("image-format-converter"),
  keywords: getKeywords("image-format-converter"),
  openGraph: {
    title: getTitle("image-format-converter"),
    description: getDescription("image-format-converter"),
    type: "website",
    url: getHref("image-format-converter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Image Format Converter - Convert Images Between Formats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("image-format-converter"),
    description: getDescription("image-format-converter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <ImageConverter />;
}
