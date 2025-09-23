"use client";

import React, { useState } from "react";
import { Check, Palette } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

// Tailwind CSS color palette
const tailwindColors = {
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006",
  },
  lime: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#365314",
    900: "#1a2e05",
    950: "#0f1902",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
  fuchsia: {
    50: "#fdf4ff",
    100: "#fae8ff",
    200: "#f5d0fe",
    300: "#f0abfc",
    400: "#e879f9",
    500: "#d946ef",
    600: "#c026d3",
    700: "#a21caf",
    800: "#86198f",
    900: "#701a75",
    950: "#4a044e",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
    950: "#500724",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
};

type CopyFormat = "hex" | "hsl" | "rgb" | "class" | "oklch";

export default function TailwindColorPicker() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copyFormat, setCopyFormat] = useState<CopyFormat>("hex");
  const [searchTerm, setSearchTerm] = useState("");

  // Convert hex to HSL
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Convert hex to OKLCH (simplified approximation)
  const hexToOklch = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Simple conversion to OKLCH (this is a simplified version)
    const l = Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 100);
    const c = Math.round(Math.sqrt(r * r + g * g + b * b) * 50);
    const h = Math.round((Math.atan2(g - r, b - r) * 180) / Math.PI);

    return `oklch(${l}% ${c / 100} ${h})`;
  };

  // Get formatted color value based on selected format
  const getFormattedColor = (
    hex: string,
    colorName: string,
    shade: string,
  ): string => {
    switch (copyFormat) {
      case "hex":
        return hex;
      case "hsl":
        return hexToHsl(hex);
      case "rgb":
        return hexToRgb(hex);
      case "class":
        return `text-${colorName}-${shade}`; // or bg-${colorName}-${shade}
      case "oklch":
        return hexToOklch(hex);
      default:
        return hex;
    }
  };

  // Copy color to clipboard
  const copyToClipboard = async (
    hex: string,
    colorName: string,
    shade: string,
  ) => {
    const value = getFormattedColor(hex, colorName, shade);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedColor(`${colorName}-${shade}`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Filter colors based on search term
  const filteredColors = Object.entries(tailwindColors).filter(([colorName]) =>
    colorName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatOptions: { value: CopyFormat; label: string }[] = [
    { value: "hex", label: "HEX (#ffffff)" },
    { value: "hsl", label: "HSL (hsl(0, 0%, 100%))" },
    { value: "rgb", label: "RGB (rgb(255, 255, 255))" },
    { value: "class", label: "Class (text-white-500)" },
    { value: "oklch", label: "OKLCH (oklch(100% 0 0))" },
  ];

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Tailwind Color Picker</h1>
        <p className="text-muted-foreground">
          Browse and copy Tailwind CSS colors in multiple formats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color Format & Search</CardTitle>
          <CardDescription>
            Choose your preferred color format and search for specific colors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Copy Format</Label>
              <Select
                value={copyFormat}
                onValueChange={(value: CopyFormat) => setCopyFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Colors</Label>
              <Input
                placeholder="Search color names (e.g., blue, red, slate)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredColors.map(([colorName, shades]) => (
          <Card key={colorName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Palette className="h-5 w-5" />
                {colorName}
              </CardTitle>
              <CardDescription>
                Click on any color to copy it in{" "}
                {
                  formatOptions
                    .find((f) => f.value === copyFormat)
                    ?.label.split("(")[0]
                }{" "}
                format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
                {Object.entries(shades).map(([shade, hex]) => (
                  <div key={shade} className="group space-y-2">
                    <div
                      className="relative h-16 w-full cursor-pointer rounded-lg border-2 border-transparent transition-all duration-200 hover:scale-105 hover:border-gray-300 active:scale-95"
                      style={{ backgroundColor: hex }}
                      onClick={() => copyToClipboard(hex, colorName, shade)}
                      title={`Click to copy ${getFormattedColor(hex, colorName, shade)}`}
                    >
                      {copiedColor === `${colorName}-${shade}` && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{shade}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {hex.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {colorName}-{shade}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No colors found matching &quot;{searchTerm}&quot;. Try searching
              for color names like &quot;blue&quot;, &quot;red&quot;, or
              &quot;slate&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Tailwind Color Picker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Complete Tailwind CSS color palette</li>
                <li>
                  • Multiple output formats (HEX, RGB, HSL, Classes, OKLCH)
                </li>
                <li>• One-click copy to clipboard</li>
                <li>• Search and filter colors</li>
                <li>• Visual feedback for copied colors</li>
                <li>• Responsive grid layout</li>
                <li>• Color hover effects</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Tailwind CSS development</li>
                <li>• Design system implementation</li>
                <li>• Color palette reference</li>
                <li>• CSS variable creation</li>
                <li>• Brand color matching</li>
                <li>• Component styling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
