import FolderStructureAnalyzer from "@/components/tools/folder-analyzer";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("folder-analyzer"),
  description: getDescription("folder-analyzer"),
  keywords: getKeywords("folder-analyzer"),
  openGraph: {
    title: getTitle("folder-analyzer"),
    description: getDescription("folder-analyzer"),
    type: "website",
    url: getHref("folder-analyzer"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Folder Structure Analyzer - Visualize and Export Directory Trees",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("folder-analyzer"),
    description: getDescription("folder-analyzer"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <FolderStructureAnalyzer />;
}
