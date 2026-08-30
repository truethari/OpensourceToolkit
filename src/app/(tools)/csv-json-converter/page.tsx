import CsvJsonConverter from "@/components/tools/csv-json-converter";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("csv-json-converter"),
  description: getDescription("csv-json-converter"),
  keywords: getKeywords("csv-json-converter"),
  openGraph: {
    title: getTitle("csv-json-converter"),
    description: getDescription("csv-json-converter"),
    type: "website",
    url: getHref("csv-json-converter"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "CSV to JSON Converter - Convert CSV and JSON Both Ways",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("csv-json-converter"),
    description: getDescription("csv-json-converter"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <CsvJsonConverter />;
}
