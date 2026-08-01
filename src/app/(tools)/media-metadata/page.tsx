import MediaMetadata from "@/components/tools/media-metadata";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("media-metadata"),
  description: getDescription("media-metadata"),
  keywords: getKeywords("media-metadata"),
  openGraph: {
    title: getTitle("media-metadata"),
    description: getDescription("media-metadata"),
    type: "website",
    url: getHref("media-metadata"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Media Metadata Viewer - EXIF, GPS, Codec & Checksum Inspector",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("media-metadata"),
    description: getDescription("media-metadata"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <MediaMetadata />;
}
