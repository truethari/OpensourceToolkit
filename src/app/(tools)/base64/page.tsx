import Base64Tool from "@/components/tools/base64";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("base64"),
  description: getDescription("base64"),
  keywords: getKeywords("base64"),
  openGraph: {
    title: getTitle("base64"),
    description: getDescription("base64"),
    type: "website",
    url: getHref("base64"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Base64 Encoder/Decoder - Convert Text and Files to Base64",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("base64"),
    description: getDescription("base64"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <Base64Tool />;
}
