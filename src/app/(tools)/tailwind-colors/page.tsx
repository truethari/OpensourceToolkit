import TailwindColorPicker from "@/components/tools/tailwind-colors";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("tailwind-colors"),
  description: getDescription("tailwind-colors"),
  keywords: getKeywords("tailwind-colors"),
  openGraph: {
    title: getTitle("tailwind-colors"),
    description: getDescription("tailwind-colors"),
    type: "website",
    url: getHref("tailwind-colors"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Tailwind Color Picker - Browse and Copy Tailwind CSS Colors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("tailwind-colors"),
    description: getDescription("tailwind-colors"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <TailwindColorPicker />;
}
