import AudioNoiseReduction from "@/components/tools/audio-noise-reduction";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("audio-noise-reduction"),
  description: getDescription("audio-noise-reduction"),
  keywords: getKeywords("audio-noise-reduction"),
  openGraph: {
    title: getTitle("audio-noise-reduction"),
    description: getDescription("audio-noise-reduction"),
    type: "website",
    url: getHref("audio-noise-reduction"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Audio Noise Reduction - Remove Background Noise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("audio-noise-reduction"),
    description: getDescription("audio-noise-reduction"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <AudioNoiseReduction />;
}
