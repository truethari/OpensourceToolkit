import PasswordGenerator from "@/components/tools/password-generator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("password-generator"),
  description: getDescription("password-generator"),
  keywords: getKeywords("password-generator"),
  openGraph: {
    title: getTitle("password-generator"),
    description: getDescription("password-generator"),
    type: "website",
    url: getHref("password-generator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Password Generator - Create Secure Passwords",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("password-generator"),
    description: getDescription("password-generator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <PasswordGenerator />;
}
