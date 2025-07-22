"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Copy, Check, Shuffle, RefreshCw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

interface PaletteColor {
  id: string;
  color: ColorValue;
  name?: string;
}

interface GradientStop {
  color: string;
  position: number;
}

interface Gradient {
  type: "linear" | "radial" | "conic";
  direction: string;
  stops: GradientStop[];
}

export default function ColorsToolkit() {
  const [currentColor, setCurrentColor] = useState<ColorValue>({
    hex: "#3b82f6",
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    hsv: { h: 217, s: 76, v: 96 },
    lab: { l: 55, a: 14, b: -64 },
    cmyk: { c: 76, m: 47, y: 0, k: 4 },
  });

  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [gradient, setGradient] = useState<Gradient>({
    type: "linear",
    direction: "to right",
    stops: [
      { color: "#3b82f6", position: 0 },
      { color: "#8b5cf6", position: 100 },
    ],
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [colorInput, setColorInput] = useState("#3b82f6");
  const [harmonyType, setHarmonyType] = useState<
    | "complementary"
    | "triadic"
    | "analogous"
    | "split-complementary"
    | "tetradic"
  >("complementary");

  // Color conversion utilities
  const hexToRgb = (
    hex: string,
  ): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToHsl = (
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
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

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToRgb = (
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const rgbToHsv = (
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; v: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
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

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
    };
  };

  const rgbToLab = (
    r: number,
    g: number,
    b: number,
  ): { l: number; a: number; b: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
    let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return {
      l: Math.round(116 * y - 16),
      a: Math.round(500 * (x - y)),
      b: Math.round(200 * (y - z)),
    };
  };

  const rgbToCmyk = (
    r: number,
    g: number,
    b: number,
  ): { c: number; m: number; y: number; k: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  };

  const updateColorFromHex = useCallback((hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    setCurrentColor({ hex, rgb, hsl, hsv, lab, cmyk });
  }, []);

  const updateColorFromRgb = useCallback((r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const hsv = rgbToHsv(r, g, b);
    const lab = rgbToLab(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    setCurrentColor({ hex, rgb: { r, g, b }, hsl, hsv, lab, cmyk });
  }, []);

  const updateColorFromHsl = useCallback((h: number, s: number, l: number) => {
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    setCurrentColor({ hex, rgb, hsl: { h, s, l }, hsv, lab, cmyk });
  }, []);

  const generateRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    updateColorFromRgb(r, g, b);
  };

  const generateColorHarmony = useCallback(
    (baseColor: ColorValue, type: string): PaletteColor[] => {
      const baseHue = baseColor.hsl.h;
      const baseSat = baseColor.hsl.s;
      const baseLit = baseColor.hsl.l;

      const createColorFromHue = (
        hue: number,
        name: string,
        id: string,
      ): PaletteColor => {
        const rgb = hslToRgb(hue, baseSat, baseLit);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        return {
          id,
          color: {
            hex,
            rgb,
            hsl: { h: hue, s: baseSat, l: baseLit },
            hsv: rgbToHsv(rgb.r, rgb.g, rgb.b),
            lab: rgbToLab(rgb.r, rgb.g, rgb.b),
            cmyk: rgbToCmyk(rgb.r, rgb.g, rgb.b),
          },
          name,
        };
      };

      const colors: PaletteColor[] = [
        { id: "base", color: baseColor, name: "Base" },
      ];

      switch (type) {
        case "complementary":
          const compHue = (baseHue + 180) % 360;
          colors.push(createColorFromHue(compHue, "Complementary", "comp"));
          break;

        case "triadic":
          [120, 240].forEach((offset, i) => {
            const hue = (baseHue + offset) % 360;
            colors.push(
              createColorFromHue(hue, `Triadic ${i + 1}`, `triadic-${i}`),
            );
          });
          break;

        case "analogous":
          [-30, 30].forEach((offset, i) => {
            const hue = (baseHue + offset + 360) % 360;
            colors.push(
              createColorFromHue(hue, `Analogous ${i + 1}`, `analogous-${i}`),
            );
          });
          break;

        case "split-complementary":
          [150, 210].forEach((offset, i) => {
            const hue = (baseHue + offset) % 360;
            colors.push(
              createColorFromHue(hue, `Split Comp ${i + 1}`, `split-comp-${i}`),
            );
          });
          break;

        case "tetradic":
          [90, 180, 270].forEach((offset, i) => {
            const hue = (baseHue + offset) % 360;
            colors.push(
              createColorFromHue(hue, `Tetradic ${i + 1}`, `tetradic-${i}`),
            );
          });
          break;

        default:
          break;
      }

      return colors;
    },
    [],
  );

  const generateTailwindGradient = (grad: Gradient): string => {
    switch (grad.type) {
      case "linear":
        return `bg-gradient-${grad.direction.replace("to ", "")} from-[${grad.stops[0].color}] to-[${grad.stops[grad.stops.length - 1].color}]`;
      case "radial":
        return `bg-radial-gradient from-[${grad.stops[0].color}] to-[${grad.stops[grad.stops.length - 1].color}]`;
      default:
        return `bg-gradient-to-r from-[${grad.stops[0].color}] to-[${grad.stops[grad.stops.length - 1].color}]`;
    }
  };

  const generateCssGradient = (grad: Gradient): string => {
    const stops = grad.stops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ");

    switch (grad.type) {
      case "linear":
        return `linear-gradient(${grad.direction}, ${stops})`;
      case "radial":
        return `radial-gradient(circle, ${stops})`;
      case "conic":
        return `conic-gradient(${stops})`;
      default:
        return `linear-gradient(${grad.direction}, ${stops})`;
    }
  };

  const getContrastRatio = (color1: ColorValue, color2: ColorValue): number => {
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1.rgb.r, color1.rgb.g, color1.rgb.b);
    const l2 = getLuminance(color2.rgb.r, color2.rgb.g, color2.rgb.b);

    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleColorInputChange = (value: string) => {
    setColorInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      updateColorFromHex(value);
    }
  };

  useEffect(() => {
    setColorInput(currentColor.hex);
  }, [currentColor.hex]);

  useEffect(() => {
    const harmony = generateColorHarmony(currentColor, harmonyType);
    setPalette(harmony);
  }, [currentColor, harmonyType, generateColorHarmony]);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Colors Toolkit</h1>
        <p className="text-muted-foreground">
          Comprehensive color tools - picker, converter, palette generator,
          gradients, and accessibility checker
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color Picker</CardTitle>
          <CardDescription>
            Pick or enter a color to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentColor.hex}
                onChange={(e) => updateColorFromHex(e.target.value)}
                className="h-12 w-12 cursor-pointer rounded-lg border-2 border-gray-200"
              />
              <div className="space-y-1">
                <Label>Color Picker</Label>
                <p className="text-sm text-muted-foreground">
                  Click to pick a color
                </p>
              </div>
            </div>

            <div className="flex flex-1 gap-2">
              <div className="flex-1">
                <Label>Hex Value</Label>
                <Input
                  value={colorInput}
                  onChange={(e) => handleColorInputChange(e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={generateRandomColor}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Random
                </Button>
              </div>
            </div>
          </div>

          <div
            className="h-24 w-full rounded-lg border"
            style={{ backgroundColor: currentColor.hex }}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="converter" className="space-y-4">
        <div className="flex flex-col gap-2">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="converter">Converter</TabsTrigger>
            <TabsTrigger value="palette">Palette</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
            <TabsTrigger value="accessibility" className="hidden md:block">
              A11y
            </TabsTrigger>
            <TabsTrigger value="shades" className="hidden md:block">
              Shades
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 md:hidden">
            <TabsTrigger value="accessibility">A11y</TabsTrigger>
            <TabsTrigger value="shades">Shades</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="converter">
          <Card>
            <CardHeader>
              <CardTitle>Color Format Converter</CardTitle>
              <CardDescription>
                Convert between different color formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>HEX</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentColor.hex}
                      onChange={(e) => handleColorInputChange(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(currentColor.hex, "hex")}
                    >
                      {copiedField === "hex" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>RGB</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`,
                          "rgb",
                        )
                      }
                    >
                      {copiedField === "rgb" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>HSL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`,
                          "hsl",
                        )
                      }
                    >
                      {copiedField === "hsl" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>HSV</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          `hsv(${currentColor.hsv.h}, ${currentColor.hsv.s}%, ${currentColor.hsv.v}%)`,
                          "hsv",
                        )
                      }
                    >
                      {copiedField === "hsv" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>LAB</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`lab(${currentColor.lab.l}, ${currentColor.lab.a}, ${currentColor.lab.b})`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          `lab(${currentColor.lab.l}, ${currentColor.lab.a}, ${currentColor.lab.b})`,
                          "lab",
                        )
                      }
                    >
                      {copiedField === "lab" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>CMYK</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`cmyk(${currentColor.cmyk.c}%, ${currentColor.cmyk.m}%, ${currentColor.cmyk.y}%, ${currentColor.cmyk.k}%)`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          `cmyk(${currentColor.cmyk.c}%, ${currentColor.cmyk.m}%, ${currentColor.cmyk.y}%, ${currentColor.cmyk.k}%)`,
                          "cmyk",
                        )
                      }
                    >
                      {copiedField === "cmyk" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Adjust Color</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Hue: {currentColor.hsl.h}°</Label>
                    <Slider
                      value={[currentColor.hsl.h]}
                      onValueChange={([h]) =>
                        updateColorFromHsl(
                          h,
                          currentColor.hsl.s,
                          currentColor.hsl.l,
                        )
                      }
                      max={360}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saturation: {currentColor.hsl.s}%</Label>
                    <Slider
                      value={[currentColor.hsl.s]}
                      onValueChange={([s]) =>
                        updateColorFromHsl(
                          currentColor.hsl.h,
                          s,
                          currentColor.hsl.l,
                        )
                      }
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lightness: {currentColor.hsl.l}%</Label>
                    <Slider
                      value={[currentColor.hsl.l]}
                      onValueChange={([l]) =>
                        updateColorFromHsl(
                          currentColor.hsl.h,
                          currentColor.hsl.s,
                          l,
                        )
                      }
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="palette">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette Generator</CardTitle>
              <CardDescription>
                Generate color harmonies and palettes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label>Harmony Type</Label>
                  <Select
                    value={harmonyType}
                    onValueChange={(
                      value:
                        | "complementary"
                        | "triadic"
                        | "analogous"
                        | "split-complementary"
                        | "tetradic",
                    ) => setHarmonyType(value)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complementary">
                        Complementary
                      </SelectItem>
                      <SelectItem value="triadic">Triadic</SelectItem>
                      <SelectItem value="analogous">Analogous</SelectItem>
                      <SelectItem value="split-complementary">
                        Split Complementary
                      </SelectItem>
                      <SelectItem value="tetradic">Tetradic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() =>
                    setPalette(generateColorHarmony(currentColor, harmonyType))
                  }
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Palette
                </Button>
              </div>

              {palette.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {palette.map((paletteColor) => (
                      <div key={paletteColor.id} className="space-y-2">
                        <div
                          className="h-20 w-full cursor-pointer rounded-lg border transition-transform hover:scale-105"
                          style={{ backgroundColor: paletteColor.color.hex }}
                          onClick={() => setCurrentColor(paletteColor.color)}
                        />
                        <div className="text-center">
                          <p className="text-xs font-medium">
                            {paletteColor.name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {paletteColor.color.hex}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      const paletteText = palette
                        .map((p) => `${p.name}: ${p.color.hex}`)
                        .join("\n");
                      copyToClipboard(paletteText, "palette");
                    }}
                    variant="outline"
                  >
                    {copiedField === "palette" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy Palette
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gradients">
          <Card>
            <CardHeader>
              <CardTitle>Gradient Generator</CardTitle>
              <CardDescription>
                Create CSS and Tailwind CSS gradients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gradient Type</Label>
                  <Select
                    value={gradient.type}
                    onValueChange={(value: "linear" | "radial" | "conic") =>
                      setGradient((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="radial">Radial</SelectItem>
                      <SelectItem value="conic">Conic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {gradient.type === "linear" && (
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={gradient.direction}
                      onValueChange={(value) =>
                        setGradient((prev) => ({ ...prev, direction: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to right">To Right</SelectItem>
                        <SelectItem value="to left">To Left</SelectItem>
                        <SelectItem value="to bottom">To Bottom</SelectItem>
                        <SelectItem value="to top">To Top</SelectItem>
                        <SelectItem value="to bottom right">
                          To Bottom Right
                        </SelectItem>
                        <SelectItem value="to bottom left">
                          To Bottom Left
                        </SelectItem>
                        <SelectItem value="to top right">
                          To Top Right
                        </SelectItem>
                        <SelectItem value="to top left">To Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Color Stops</h4>
                {gradient.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => {
                        const newStops = [...gradient.stops];
                        newStops[index].color = e.target.value;
                        setGradient((prev) => ({ ...prev, stops: newStops }));
                      }}
                      className="h-8 w-8 flex-shrink-0 rounded border"
                    />
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => {
                        const newStops = [...gradient.stops];
                        newStops[index].position = parseInt(e.target.value);
                        setGradient((prev) => ({ ...prev, stops: newStops }));
                      }}
                      className="flex-1"
                    />
                    <span className="w-12 flex-shrink-0 text-sm">
                      {stop.position}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newStops = gradient.stops.filter(
                          (_, i) => i !== index,
                        );
                        setGradient((prev) => ({ ...prev, stops: newStops }));
                      }}
                      disabled={gradient.stops.length <= 2}
                      className="flex-shrink-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={() => {
                    const newStops = [
                      ...gradient.stops,
                      { color: currentColor.hex, position: 50 },
                    ];
                    setGradient((prev) => ({ ...prev, stops: newStops }));
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Stop
                </Button>
              </div>

              <div
                className="h-24 w-full rounded-lg border"
                style={{ background: generateCssGradient(gradient) }}
              />

              <div className="space-y-2">
                <Label>CSS Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={`background: ${generateCssGradient(gradient)};`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        `background: ${generateCssGradient(gradient)};`,
                        "css-gradient",
                      )
                    }
                  >
                    {copiedField === "css-gradient" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tailwind CSS Classes</Label>
                <div className="flex gap-2">
                  <Input
                    value={generateTailwindGradient(gradient)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        generateTailwindGradient(gradient),
                        "tailwind-gradient",
                      )
                    }
                  >
                    {copiedField === "tailwind-gradient" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Checker</CardTitle>
              <CardDescription>
                Check color contrast ratios for accessibility compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Text on Background</h4>

                  <div className="space-y-2">
                    <Label>White Text</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div
                        className="flex h-16 flex-1 items-center justify-center rounded-lg font-semibold text-white"
                        style={{ backgroundColor: currentColor.hex }}
                      >
                        Sample Text
                      </div>
                      <div className="flex-shrink-0 space-y-1 text-sm">
                        {(() => {
                          const whiteColor: ColorValue = {
                            hex: "#ffffff",
                            rgb: { r: 255, g: 255, b: 255 },
                            hsl: { h: 0, s: 0, l: 100 },
                            hsv: { h: 0, s: 0, v: 100 },
                            lab: { l: 100, a: 0, b: 0 },
                            cmyk: { c: 0, m: 0, y: 0, k: 0 },
                          };
                          const ratio = getContrastRatio(
                            whiteColor,
                            currentColor,
                          );
                          return (
                            <>
                              <p>Ratio: {ratio.toFixed(2)}:1</p>
                              <p
                                className={
                                  ratio >= 4.5
                                    ? "text-green-600"
                                    : ratio >= 3
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                {ratio >= 4.5
                                  ? "AA ✓"
                                  : ratio >= 3
                                    ? "AA Large ✓"
                                    : "Fail ✗"}
                              </p>
                              <p
                                className={
                                  ratio >= 7
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }
                              >
                                {ratio >= 7 ? "AAA ✓" : "AAA ✗"}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Black Text</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div
                        className="flex h-16 flex-1 items-center justify-center rounded-lg font-semibold text-black"
                        style={{ backgroundColor: currentColor.hex }}
                      >
                        Sample Text
                      </div>
                      <div className="flex-shrink-0 space-y-1 text-sm">
                        {(() => {
                          const blackColor: ColorValue = {
                            hex: "#000000",
                            rgb: { r: 0, g: 0, b: 0 },
                            hsl: { h: 0, s: 0, l: 0 },
                            hsv: { h: 0, s: 0, v: 0 },
                            lab: { l: 0, a: 0, b: 0 },
                            cmyk: { c: 0, m: 0, y: 0, k: 100 },
                          };
                          const ratio = getContrastRatio(
                            blackColor,
                            currentColor,
                          );
                          return (
                            <>
                              <p>Ratio: {ratio.toFixed(2)}:1</p>
                              <p
                                className={
                                  ratio >= 4.5
                                    ? "text-green-600"
                                    : ratio >= 3
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                {ratio >= 4.5
                                  ? "AA ✓"
                                  : ratio >= 3
                                    ? "AA Large ✓"
                                    : "Fail ✗"}
                              </p>
                              <p
                                className={
                                  ratio >= 7
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }
                              >
                                {ratio >= 7 ? "AAA ✓" : "AAA ✗"}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Accessibility Guidelines</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>AA: 4.5:1 minimum (normal text)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span>AA Large: 3:1 minimum (18pt+ or 14pt+ bold)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>AAA: 7:1 minimum (enhanced)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span>Fail: Below minimum requirements</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shades">
          <Card>
            <CardHeader>
              <CardTitle>Shades & Tints</CardTitle>
              <CardDescription>
                Generate lighter and darker variations of your color
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
                {Array.from({ length: 10 }, (_, i) => {
                  const lightness = 10 + i * 8;
                  const rgb = hslToRgb(
                    currentColor.hsl.h,
                    currentColor.hsl.s,
                    lightness,
                  );
                  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

                  return (
                    <div key={i} className="space-y-1">
                      <div
                        className="h-16 w-full cursor-pointer rounded-lg border transition-transform hover:scale-105"
                        style={{ backgroundColor: hex }}
                        onClick={() => updateColorFromHex(hex)}
                      />
                      <p className="break-all text-center font-mono text-xs">
                        {hex}
                      </p>
                      <p className="text-center text-xs text-muted-foreground">
                        {lightness}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>About Colors Toolkit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Interactive color picker and input</li>
                <li>• Convert between HEX, RGB, HSL, HSV, LAB, CMYK</li>
                <li>• Generate color harmonies and palettes</li>
                <li>• Create CSS and Tailwind gradients</li>
                <li>• Check accessibility contrast ratios</li>
                <li>• Generate shades and tints</li>
                <li>• Copy colors in various formats</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Web design and development</li>
                <li>• Brand identity creation</li>
                <li>• Accessibility compliance</li>
                <li>• Color scheme planning</li>
                <li>• Design system development</li>
                <li>• Print design preparation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
