import ColorsToolkit from "@/components/tools/colors";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("colors"),
  description: getDescription("colors"),
  keywords: getKeywords("colors"),
  openGraph: {
    title: getTitle("colors"),
    description: getDescription("colors"),
    type: "website",
    url: getHref("colors"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Colors Toolkit - Color Picker, Converter & Palette Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("colors"),
    description: getDescription("colors"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <ColorsToolkit />;
}
