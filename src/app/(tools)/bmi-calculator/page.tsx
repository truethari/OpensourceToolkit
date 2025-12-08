import BMICalculator from "@/components/tools/bmi-calculator";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("bmi-calculator"),
  description: getDescription("bmi-calculator"),
  keywords: getKeywords("bmi-calculator"),
  openGraph: {
    title: getTitle("bmi-calculator"),
    description: getDescription("bmi-calculator"),
    type: "website",
    url: getHref("bmi-calculator"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "BMI Calculator - Body Mass Index and Health Metrics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("bmi-calculator"),
    description: getDescription("bmi-calculator"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <BMICalculator />;
}
