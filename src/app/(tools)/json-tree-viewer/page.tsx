import JSONTreeViewer from "@/components/tools/json-tree-viewer";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("json-tree-viewer"),
  description: getDescription("json-tree-viewer"),
  keywords: getKeywords("json-tree-viewer"),
  openGraph: {
    title: getTitle("json-tree-viewer"),
    description: getDescription("json-tree-viewer"),
    type: "website",
    url: getHref("json-tree-viewer"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "JSON Tree Viewer - Visualize JSON Structure Interactively",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("json-tree-viewer"),
    description: getDescription("json-tree-viewer"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <JSONTreeViewer />;
}
