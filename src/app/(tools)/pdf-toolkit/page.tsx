import PDFToolkit from "@/components/tools/pdf-toolkit";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("pdf-toolkit"),
  description: getDescription("pdf-toolkit"),
  keywords: getKeywords("pdf-toolkit"),
  openGraph: {
    title: getTitle("pdf-toolkit"),
    description: getDescription("pdf-toolkit"),
    type: "website",
    url: getHref("pdf-toolkit"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "PDF Toolkit - Comprehensive PDF Manipulation Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("pdf-toolkit"),
    description: getDescription("pdf-toolkit"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <PDFToolkit />;
}
