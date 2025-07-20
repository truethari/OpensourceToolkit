import CameraMicTester from "@/components/tools/camera-mic-tester";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("camera-mic-tester"),
  description: getDescription("camera-mic-tester"),
  keywords: getKeywords("camera-mic-tester"),
  openGraph: {
    title: getTitle("camera-mic-tester"),
    description: getDescription("camera-mic-tester"),
    type: "website",
    url: getHref("camera-mic-tester"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Camera & Microphone Tester - Test Media Devices & Record",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("camera-mic-tester"),
    description: getDescription("camera-mic-tester"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <CameraMicTester />;
}
