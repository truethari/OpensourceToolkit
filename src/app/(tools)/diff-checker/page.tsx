import type { Metadata } from "next";

import DiffChecker from "@/components/tools/diff-checker";

export const metadata: Metadata = {
  title: "Diff Checker - Advanced Text and File Comparison Tool",
  description:
    "Compare texts and files with advanced diff algorithms, side-by-side visualization, and export options. Perfect for developers, writers, and version control workflows with patch generation, merge conflict resolution, and detailed statistics.",
  keywords:
    "diff checker, text comparison, file comparison, diff tool, merge conflicts, patch generator, version control, code comparison, text diff, file diff, git diff, unified diff, side by side comparison, character diff, line comparison",
  authors: [{ name: "OpenSource Toolkit" }],
  creator: "OpenSource Toolkit",
  publisher: "OpenSource Toolkit",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://opensourcetoolkit.dev"),
  alternates: {
    canonical: "/diff-checker",
  },
  openGraph: {
    title: "Diff Checker - Advanced Text and File Comparison Tool",
    description:
      "Compare texts and files with advanced diff algorithms, side-by-side visualization, and export options. Features include patch generation, merge conflict resolution, and detailed comparison statistics.",
    url: "/diff-checker",
    siteName: "OpenSource Toolkit",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diff Checker - Advanced Text and File Comparison Tool",
    description:
      "Compare texts and files with advanced diff algorithms, side-by-side visualization, and export options. Perfect for developers and version control workflows.",
    creator: "@opensourcetoolkit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function DiffCheckerPage() {
  return <DiffChecker />;
}
