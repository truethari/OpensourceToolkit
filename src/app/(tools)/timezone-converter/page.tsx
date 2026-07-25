import TimezoneConverter from "@/components/tools/timezone-converter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("timezone-converter"),
  description: getDescription("timezone-converter"),
  keywords: getKeywords("timezone-converter"),
  openGraph: {
    title: getTitle("timezone-converter"),
    description: getDescription("timezone-converter"),
    type: "website",
    url: getHref("timezone-converter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Timezone Converter - Compare Times Across Multiple Timezones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("timezone-converter"),
    description: getDescription("timezone-converter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <TimezoneConverter />;
}
