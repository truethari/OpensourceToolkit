import MarkdownEditor from "@/components/tools/markdown-editor";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("markdown-editor"),
  description: getDescription("markdown-editor"),
  keywords: getKeywords("markdown-editor"),
  openGraph: {
    title: getTitle("markdown-editor"),
    description: getDescription("markdown-editor"),
    type: "website",
    url: getHref("markdown-editor"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Markdown Editor & Preview - Write and Preview Markdown",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("markdown-editor"),
    description: getDescription("markdown-editor"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <MarkdownEditor />;
}
