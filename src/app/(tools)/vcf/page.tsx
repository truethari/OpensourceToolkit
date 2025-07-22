import VCF from "@/components/tools/vcf";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("vcf"),
  description: getDescription("vcf"),
  keywords: getKeywords("vcf"),
  openGraph: {
    title: getTitle("vcf"),
    description: getDescription("vcf"),
    type: "website",
    url: getHref("vcf"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "VCF vCard File Reader & Writer - Parse and Generate Contact Files",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("vcf"),
    description: getDescription("vcf"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <VCF />;
}
