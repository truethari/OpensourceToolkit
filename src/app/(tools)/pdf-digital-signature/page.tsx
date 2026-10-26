import PdfDigitalSignature from "@/components/tools/pdf-digital-signature";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("pdf-digital-signature"),
  description: getDescription("pdf-digital-signature"),
  keywords: getKeywords("pdf-digital-signature"),
  openGraph: {
    title: getTitle("pdf-digital-signature"),
    description: getDescription("pdf-digital-signature"),
    type: "website",
    url: getHref("pdf-digital-signature"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "PDF Digital Signature - Certificate-Based PDF Signing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("pdf-digital-signature"),
    description: getDescription("pdf-digital-signature"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <PdfDigitalSignature />;
}
