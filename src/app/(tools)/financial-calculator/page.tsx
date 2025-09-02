import FinancialCalculator from "@/components/tools/financial-calculator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("financial-calculator"),
  description: getDescription("financial-calculator"),
  keywords: getKeywords("financial-calculator"),
  openGraph: {
    title: getTitle("financial-calculator"),
    description: getDescription("financial-calculator"),
    type: "website",
    url: getHref("financial-calculator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Financial Calculator - Interest, Loan, Investment Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("financial-calculator"),
    description: getDescription("financial-calculator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <FinancialCalculator />;
}
