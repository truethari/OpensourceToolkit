import { Hash, Clock } from "lucide-react";

import type { ITool } from "@/types";

export const tools: ITool[] = [
  {
    id: "uuid",
    title: "UUID Generator",
    shortTitle: "UUID",
    description:
      "Generate universally unique identifiers with multiple versions and batch options",
    icon: Hash,
    color: "bg-blue-500",
    category: "Generators",
    tags: ["uuid", "guid", "identifier", "unique"],
    features: [
      "Version 4 (Random)",
      "Version 1 (Timestamp)",
      "Batch Generation",
      "Copy to Clipboard",
    ],
    popular: true,
    href: "/uuid",
    seo: {
      title: "UUID Generator - Generate Unique Identifiers",
      description:
        "Create UUIDs with various versions and batch options. Perfect for developers needing unique identifiers.",
      keywords: "uuid, guid, identifier, unique, generator",
    },
  },
  {
    id: "timestamp",
    title: "Timestamp Converter",
    shortTitle: "Timestamp",
    description:
      "Convert, generate, and solve timestamps in various formats with batch processing",
    icon: Clock,
    color: "bg-green-500",
    category: "Converters",
    tags: ["timestamp", "unix", "date", "time", "convert"],
    features: [
      "Live Current Time",
      "Custom Date/Time",
      "Batch Convert",
      "Multiple Formats",
    ],
    popular: true,
    href: "/timestamp",
    seo: {
      title: "Timestamp Converter - Convert and Generate Timestamps",
      description:
        "Convert timestamps to various formats, generate current time, and batch process dates. Ideal for developers and data analysts.",
      keywords: "timestamp, unix, date, time, convert, generator",
    },
  },
];
