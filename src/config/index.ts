import { Hash, Clock, Fingerprint, Image, Text } from "lucide-react";

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
  {
    id: "jwt",
    title: "JWT Decoder/Encoder",
    shortTitle: "JWT",
    description:
      "Decode, encode, and verify JSON Web Tokens with support for multiple algorithms",
    icon: Fingerprint,
    color: "bg-purple-500",
    category: "Security",
    tags: ["jwt", "token", "authentication", "security"],
    features: [
      "Decode JWTs",
      "Encode JWTs",
      "Verify Signatures",
      "Support for Multiple Algorithms",
    ],
    popular: true,
    href: "/jwt",
    seo: {
      title: "JWT Decoder/Encoder - Manage JSON Web Tokens",
      description:
        "Decode, encode, and verify JWTs with support for various algorithms. Essential for secure web applications.",
      keywords: "jwt, token, authentication, security, decoder, encoder",
    },
  },
  {
    id: "image-format-converter",
    title: "Image Format Converter",
    shortTitle: "Image Converter",
    description:
      "Convert images between formats like PNG, JPEG, GIF, and WebP with batch processing",
    icon: Image,
    color: "bg-orange-500",
    category: "Converters",
    tags: ["image", "converter", "png", "jpeg", "gif", "webp"],
    features: [
      "Batch Conversion",
      "Multiple Formats",
      "Resize and Optimize",
      "Download Converted Images",
    ],
    popular: true,
    href: "/image-converter",
    seo: {
      title: "Image Format Converter - Convert Images Easily",
      description:
        "Convert images between various formats like PNG, JPEG, GIF, and WebP. Supports batch processing and optimization.",
      keywords: "image, converter, png, jpeg, gif, webp, batch",
    },
  },
  {
    id: "text-case-converter",
    title: "Text Case Converter",
    shortTitle: "Text Converter",
    description:
      "Convert text between different cases like uppercase, lowercase, title case, and more",
    icon: Text,
    color: "bg-teal-500",
    category: "Converters",
    tags: ["text", "converter", "case", "uppercase", "lowercase", "title case"],
    features: ["Uppercase", "Lowercase", "Title Case", "Sentence Case"],
    popular: false,
    href: "/text-converter",
    seo: {
      title: "Text Case Converter - Convert Text Cases Easily",
      description:
        "Convert text between different cases like uppercase, lowercase, title case, and more. Perfect for writers and developers.",
      keywords: "text, converter, case, uppercase, lowercase, title case",
    },
  },
];
