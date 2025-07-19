import CronScheduler from "@/components/tools/cron-scheduler";
import { getTitle, getKeywords, getDescription, getHref } from "@/utils/SEO";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getTitle("cron-scheduler"),
  description: getDescription("cron-scheduler"),
  keywords: getKeywords("cron-scheduler"),
  openGraph: {
    title: getTitle("cron-scheduler"),
    description: getDescription("cron-scheduler"),
    type: "website",
    url: getHref("cron-scheduler"),
    siteName: "OpensourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "Cron Job Scheduler - Schedule Automated API Calls",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: getTitle("cron-scheduler"),
    description: getDescription("cron-scheduler"),
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
};

export default function Page() {
  return <CronScheduler />;
}
