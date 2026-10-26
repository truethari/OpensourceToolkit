import PdfSignature from "@/components/tools/pdf-signature";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("pdf-signature"),
  description: getDescription("pdf-signature"),
  keywords: getKeywords("pdf-signature"),
  openGraph: {
    title: getTitle("pdf-signature"),
    description: getDescription("pdf-signature"),
    type: "website",
    url: getHref("pdf-signature"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "PDF Signature - Sign PDF Documents Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("pdf-signature"),
    description: getDescription("pdf-signature"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <PdfSignature />;
}
