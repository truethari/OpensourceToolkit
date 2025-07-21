import ContributeGuide from "@/components/contribute-guide";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute to OpenSource Toolkit - Join Our Developer Community",
  description:
    "Learn how to contribute to OpenSource Toolkit. Add new tools, fix bugs, and help build the most comprehensive collection of developer utilities. Step-by-step guide included.",
  keywords:
    "contribute, open source, developer tools, programming, github, pull request, typescript, react, nextjs, community, coding guidelines, development",
  openGraph: {
    title: "Contribute to OpenSource Toolkit - Join Our Developer Community",
    description:
      "Learn how to contribute to OpenSource Toolkit. Add new tools, fix bugs, and help build the most comprehensive collection of developer utilities.",
    type: "website",
    url: "https://opensourcetoolkit.com/contribute-guide",
    siteName: "OpenSourceToolkit",
    images: [
      {
        url: "https://opensourcetoolkit.com/seo/1.png",
        width: 1200,
        height: 630,
        alt: "OpenSource Toolkit - Contribute Guide for Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contribute to OpenSource Toolkit - Join Our Developer Community",
    description:
      "Learn how to contribute to OpenSource Toolkit. Add new tools, fix bugs, and help build the most comprehensive collection of developer utilities.",
    images: ["https://opensourcetoolkit.com/seo/1.png"],
  },
  alternates: {
    canonical: "https://opensourcetoolkit.com/contribute-guide",
  },
};

export default function Page() {
  return <ContributeGuide />;
}
