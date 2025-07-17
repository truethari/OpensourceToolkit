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
  },
];
