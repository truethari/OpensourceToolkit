import {
  Text,
  Hash,
  Clock,
  Image,
  FolderOpen,
  Fingerprint,
  Key,
  MapPin,
} from "lucide-react";

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
  {
    id: "folder-analyzer",
    title: "Folder Structure Analyzer",
    shortTitle: "Folder Analyzer",
    description:
      "Analyze, visualize, and export folder structures with advanced filtering, statistics, and multi-format export options",
    icon: FolderOpen,
    color: "bg-blue-500",
    category: "File Tools",
    tags: [
      "folder",
      "directory",
      "structure",
      "tree",
      "export",
      "analyze",
      "files",
    ],
    features: [
      "Interactive Tree View",
      "Smart File Filtering",
      "Multi-Format Export",
      "Detailed Statistics",
    ],
    popular: false,
    href: "/folder-analyzer",
    seo: {
      title: "Folder Structure Analyzer - Visualize and Export Directory Trees",
      description:
        "Analyze folder structures, visualize directory trees, filter files by type and size, and export in JSON, CSV, XML formats. Perfect for developers and system administrators.",
      keywords:
        "folder structure, directory tree, file analyzer, export folder, file organization, directory mapping",
    },
  },
  {
    id: "password-generator",
    title: "Password Generator",
    shortTitle: "Password",
    description:
      "Generate secure passwords, passphrases, and PINs with advanced customization and security analysis",
    icon: Key,
    color: "bg-red-500",
    category: "Security",
    tags: [
      "password",
      "generator",
      "security",
      "passphrase",
      "pin",
      "encryption",
    ],
    features: [
      "Advanced Password Generation",
      "Passphrase Generator",
      "PIN & Code Generator",
      "Batch Generation",
      "Security Analysis",
    ],
    popular: true,
    href: "/password-generator",
    seo: {
      title: "Password Generator - Create Secure Passwords",
      description:
        "Generate strong passwords, memorable passphrases, and secure PINs with real-time security analysis. Features batch generation, custom presets, and entropy calculation.",
      keywords:
        "password generator, secure password, passphrase, PIN generator, security, encryption, strong password",
    },
  },
  {
    id: "ip-location",
    title: "IP Location Checker",
    shortTitle: "IP Location",
    description:
      "Check IP address geolocation information including country, region, city, ISP, and more",
    icon: MapPin,
    color: "bg-indigo-500",
    category: "Network Tools",
    tags: [
      "ip",
      "location",
      "geolocation",
      "network",
      "country",
      "region",
      "city",
      "isp",
    ],
    features: [
      "IP Geolocation Lookup",
      "ISP Information",
      "Country & Region Details",
      "Timezone Detection",
      "Batch IP Processing",
    ],
    popular: false,
    href: "/ip-location",
    seo: {
      title: "IP Location Checker - Find IP Address Geolocation",
      description:
        "Check IP address location, ISP information, country, region, city, and timezone. Support for both IPv4 and IPv6 addresses with batch processing.",
      keywords:
        "ip location, geolocation, ip address, country, region, city, isp, timezone, network tools",
    },
  },
];
