import PrivacyPolicyGenerator from "@/components/tools/privacy-policy-generator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("privacy-policy-generator"),
  description: getDescription("privacy-policy-generator"),
  keywords: getKeywords("privacy-policy-generator"),
  openGraph: {
    title: getTitle("privacy-policy-generator"),
    description: getDescription("privacy-policy-generator"),
    type: "website",
    url: getHref("privacy-policy-generator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Privacy Policy Generator - Create Custom Privacy Policies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("privacy-policy-generator"),
    description: getDescription("privacy-policy-generator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function PrivacyPolicyGeneratorPage() {
  return <PrivacyPolicyGenerator />;
}
