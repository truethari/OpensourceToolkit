import QRGenerator from "@/components/tools/qr-generator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("qr-generator"),
  description: getDescription("qr-generator"),
  keywords: getKeywords("qr-generator"),
  openGraph: {
    title: getTitle("qr-generator"),
    description: getDescription("qr-generator"),
    type: "website",
    url: getHref("qr-generator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "QR Code Generator - Create Custom QR Codes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("qr-generator"),
    description: getDescription("qr-generator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function QRGeneratorPage() {
  return <QRGenerator />;
}
