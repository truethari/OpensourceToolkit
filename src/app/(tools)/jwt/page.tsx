import JWT from "@/components/tools/jwt";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("jwt"),
  description: getDescription("jwt"),
  keywords: getKeywords("jwt"),
  openGraph: {
    title: getTitle("jwt"),
    description: getDescription("jwt"),
    type: "website",
    url: getHref("jwt"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "JWT Decoder/Encoder - Decode and Encode JSON Web Tokens",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("jwt"),
    description: getDescription("jwt"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <JWT />;
}
