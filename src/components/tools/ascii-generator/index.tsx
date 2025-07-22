"use client";

import figlet from "figlet";
import Image from "next/image";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Eye,
  Type,
  Copy,
  Code,
  Info,
  Save,
  Wand2,
  Trash2,
  Upload,
  Palette,
  FileText,
  Settings,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import { FIGLET_FONTS } from "./utils";

interface AsciiSettings {
  font: string;
  width: number;
  height: number;
  characterSet: string;
  invert: boolean;
  horizontalLayout: string;
  verticalLayout: string;
  whitespaceBreak: boolean;
}

interface SavedArt {
  id: string;
  name: string;
  content: string;
  type: "text" | "image";
  settings: Partial<AsciiSettings>;
  createdAt: Date;
}

// Character sets for image to ASCII
const CHARACTER_SETS = {
  standard: "@%#*+=-:. ",
  detailed:
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  simple: "# . ",
  blocks: "█▉▊▋▌▍▎▏ ",
  numeric: "9876543210 ",
  custom: "ABCDEFGHIJ",
};

// Predefined templates
const TEMPLATES = [
  {
    name: "Classic Banner",
    text: "HELLO",
    font: "Banner",
    settings: { width: 80 },
  },
  {
    name: "Block Text",
    text: "ASCII",
    font: "Block",
    settings: { width: 100 },
  },
  { name: "Digital", text: "CODE", font: "Digital", settings: { width: 60 } },
  { name: "Big Text", text: "BIG", font: "Big", settings: { width: 120 } },
  { name: "Shadow", text: "SHADOW", font: "Shadow", settings: { width: 100 } },
  { name: "Doom Style", text: "GAME", font: "Doom", settings: { width: 80 } },
];

export default function AsciiGenerator() {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [textInput, setTextInput] = useState("HELLO");
  const [asciiOutput, setAsciiOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [savedArts, setSavedArts] = useState<SavedArt[]>([]);
  const [fontLoading, setFontLoading] = useState(false);

  const [settings, setSettings] = useState<AsciiSettings>({
    font: "standard",
    width: 80,
    height: 50,
    characterSet: "standard",
    invert: false,
    horizontalLayout: "default",
    verticalLayout: "default",
    whitespaceBreak: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Text to ASCII using figlet with external font loading
  const generateTextAscii = useCallback(
    async (text: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          setFontLoading(true);

          const options = {
            font: settings.font as figlet.Fonts,
            horizontalLayout:
              settings.horizontalLayout as figlet.KerningMethods,
            verticalLayout: settings.verticalLayout as figlet.KerningMethods,
            width: settings.width,
            whitespaceBreak: settings.whitespaceBreak,
          };

          figlet.text(text, options, (err, result) => {
            setFontLoading(false);

            if (err) {
              console.error("Figlet error:", err);
              // Try with Standard font as fallback
              figlet.text(
                text,
                { font: "Standard" },
                (fallbackErr, fallbackResult) => {
                  if (fallbackErr) {
                    reject(new Error(`Font loading failed: ${err.message}`));
                  } else {
                    toast.warning(
                      `Font "${settings.font}" failed to load, using Standard font`,
                    );
                    resolve(fallbackResult || "");
                  }
                },
              );
            } else {
              resolve(result || "");
            }
          });
        } catch (error) {
          setFontLoading(false);
          console.error("Text generation error:", error);
          reject(error);
        }
      });
    },
    [settings],
  );

  // Image to ASCII using Canvas API
  const generateImageAscii = useCallback(
    async (imageFile: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = canvasRef.current;
            if (!canvas) {
              reject(new Error("Canvas not available"));
              return;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
            }

            // Calculate dimensions
            const targetWidth = settings.width;
            const targetHeight = settings.height;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Get image data
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imageData.data;

            const chars =
              CHARACTER_SETS[
                settings.characterSet as keyof typeof CHARACTER_SETS
              ];
            let ascii = "";

            // Convert pixels to ASCII
            for (let y = 0; y < targetHeight; y++) {
              for (let x = 0; x < targetWidth; x++) {
                const offset = (y * targetWidth + x) * 4;
                const r = pixels[offset];
                const g = pixels[offset + 1];
                const b = pixels[offset + 2];

                // Calculate brightness
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

                let charIndex;
                if (settings.invert) {
                  charIndex = Math.floor(brightness * (chars.length - 1));
                } else {
                  charIndex = Math.floor((1 - brightness) * (chars.length - 1));
                }

                ascii += chars[charIndex] || " ";
              }
              ascii += "\n";
            }

            resolve(ascii);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(imageFile);
      });
    },
    [settings],
  );

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success("Image uploaded successfully");
  };

  // Generate ASCII art
  const generateAscii = useCallback(async () => {
    if (!textInput.trim() && !uploadedImage) {
      toast.error("Please enter text or upload an image");
      return;
    }

    setIsProcessing(true);

    try {
      let result = "";

      if (activeTab === "text" && textInput.trim()) {
        result = await generateTextAscii(textInput);
      } else if (activeTab === "image" && uploadedImage) {
        result = await generateImageAscii(uploadedImage);
      }

      setAsciiOutput(result);
      // toast.success("ASCII art generated successfully");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate ASCII art");
    } finally {
      setIsProcessing(false);
    }
  }, [
    activeTab,
    textInput,
    uploadedImage,
    generateTextAscii,
    generateImageAscii,
  ]);

  // Auto-generate for text changes
  useEffect(() => {
    if (activeTab === "text" && textInput.trim()) {
      const timeoutId = setTimeout(() => {
        generateAscii();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [
    textInput,
    settings.font,
    settings.horizontalLayout,
    settings.verticalLayout,
    activeTab,
    generateAscii,
  ]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!asciiOutput.trim()) {
      toast.error("No ASCII art to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(asciiOutput);
      toast.success("ASCII art copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Save ASCII art
  const saveAsciiArt = () => {
    if (!asciiOutput.trim()) {
      toast.error("No ASCII art to save");
      return;
    }

    const name = prompt("Enter a name for this ASCII art:");
    if (!name?.trim()) return;

    const newArt: SavedArt = {
      id: crypto.randomUUID(),
      name: name.trim(),
      content: asciiOutput,
      type: activeTab,
      settings: { ...settings },
      createdAt: new Date(),
    };

    setSavedArts((prev) => [newArt, ...prev]);
    toast.success("ASCII art saved successfully");
  };

  // Load saved ASCII art
  const loadSavedArt = (art: SavedArt) => {
    setAsciiOutput(art.content);
    setActiveTab(art.type);
    setSettings((prev) => ({ ...prev, ...art.settings }));
    toast.success(`Loaded "${art.name}"`);
  };

  // Delete saved ASCII art
  const deleteSavedArt = (id: string) => {
    setSavedArts((prev) => prev.filter((art) => art.id !== id));
    toast.success("ASCII art deleted");
  };

  // Load template
  const loadTemplate = (template: (typeof TEMPLATES)[0]) => {
    setTextInput(template.text);
    setSettings((prev) => ({
      ...prev,
      font: template.font,
      ...template.settings,
    }));
    setActiveTab("text");
    toast.success(`Template "${template.name}" loaded`);
  };

  // Export functions
  const exportAsText = () => {
    if (!asciiOutput.trim()) {
      toast.error("No ASCII art to export");
      return;
    }

    const blob = new Blob([asciiOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascii-art-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ASCII art exported as text file");
  };

  const exportAsHTML = () => {
    if (!asciiOutput.trim()) {
      toast.error("No ASCII art to export");
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>ASCII Art</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #000; 
            color: #0f0; 
            padding: 20px; 
            margin: 0;
            overflow-x: auto;
        }
        pre { 
            font-size: 12px; 
            line-height: 1; 
            white-space: pre; 
            margin: 0;
        }
    </style>
</head>
<body>
    <pre>${asciiOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascii-art-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("ASCII art exported as HTML file");
  };

  return (
    <ToolsWrapper>
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
          <Type className="h-8 w-8 text-purple-500" />
          ASCII Art Generator
        </h1>
        <p className="text-muted-foreground">
          Convert text and images to ASCII art using professional fonts and
          advanced algorithms
        </p>
        {fontLoading && (
          <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <p className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading font from figlet.org...
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Panel - Input and Settings */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Input & Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "text" | "image")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="image"
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="text-input">Text to Convert</Label>
                    <Textarea
                      id="text-input"
                      placeholder="Enter your text here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="resize-none font-mono"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="font-select">
                      ASCII Font ({FIGLET_FONTS.length} available)
                    </Label>
                    <Select
                      value={settings.font.toLowerCase()}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, font: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {FIGLET_FONTS.map((font) => (
                          <SelectItem key={font} value={font.toLowerCase()}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Horizontal Layout</Label>
                      <Select
                        value={settings.horizontalLayout}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            horizontalLayout: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="fitted">Fitted</SelectItem>
                          <SelectItem value="controlled smushing">
                            Controlled
                          </SelectItem>
                          <SelectItem value="universal smushing">
                            Universal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Vertical Layout</Label>
                      <Select
                        value={settings.verticalLayout}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            verticalLayout: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="fitted">Fitted</SelectItem>
                          <SelectItem value="controlled smushing">
                            Controlled
                          </SelectItem>
                          <SelectItem value="universal smushing">
                            Universal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whitespace-break"
                      checked={settings.whitespaceBreak}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          whitespaceBreak: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="whitespace-break">
                      Break on whitespace
                    </Label>
                  </div>

                  <div>
                    <Label>Quick Templates</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {TEMPLATES.map((template) => (
                        <Badge
                          key={template.name}
                          variant="outline"
                          className="cursor-pointer py-2 text-center text-xs hover:bg-muted"
                          onClick={() => loadTemplate(template)}
                        >
                          {template.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <div className="rounded-lg border-2 border-dashed p-6 text-center">
                      {previewImage ? (
                        <div className="space-y-4">
                          <div className="relative h-32 w-full">
                            <Image
                              src={previewImage}
                              alt="Preview"
                              fill
                              className="rounded object-contain"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadedImage(null);
                              setPreviewImage(null);
                              setAsciiOutput("");
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload an image
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Max 10MB • JPG, PNG, GIF supported
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <Label>Output Width</Label>
                    <Slider
                      value={[settings.width]}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({ ...prev, width: value }))
                      }
                      min={20}
                      max={200}
                      step={5}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.width} characters
                    </span>
                  </div>

                  <div>
                    <Label>Output Height</Label>
                    <Slider
                      value={[settings.height]}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({ ...prev, height: value }))
                      }
                      min={10}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.height} lines
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="character-set">Character Set</Label>
                    <Select
                      value={settings.characterSet}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          characterSet: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          Standard (@%#*+=-:. )
                        </SelectItem>
                        <SelectItem value="detailed">
                          Detailed (70 chars)
                        </SelectItem>
                        <SelectItem value="simple">Simple (# . )</SelectItem>
                        <SelectItem value="blocks">
                          Unicode Blocks (█▉▊▋▌▍▎▏ )
                        </SelectItem>
                        <SelectItem value="numeric">
                          Numeric (9876543210 )
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="invert-colors"
                      checked={settings.invert}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          invert: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="invert-colors">Invert colors</Label>
                  </div>

                  {uploadedImage && (
                    <Button
                      onClick={generateAscii}
                      className="w-full"
                      disabled={isProcessing || fontLoading}
                    >
                      {isProcessing || fontLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {fontLoading ? "Loading font..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate ASCII Art
                        </>
                      )}
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Saved ASCII Arts */}
          {savedArts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Saved ASCII Arts ({savedArts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {savedArts.map((art) => (
                    <div
                      key={art.id}
                      className="flex items-center justify-between rounded border p-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{art.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {art.type}
                          </Badge>
                          <span>{art.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadSavedArt(art)}
                          title="Load this ASCII art"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSavedArt(art.id)}
                          title="Delete this ASCII art"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Output and Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ASCII Art Output
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveAsciiArt}
                    disabled={!asciiOutput.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={!asciiOutput.trim()}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAsText}
                    disabled={!asciiOutput.trim()}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    .txt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAsHTML}
                    disabled={!asciiOutput.trim()}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    .html
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asciiOutput ? (
                <div className="space-y-4">
                  <div className="relative">
                    <pre className="max-h-96 overflow-auto whitespace-pre rounded border bg-black p-4 font-mono text-xs leading-none text-green-400">
                      {asciiOutput}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Lines: {asciiOutput.split("\n").length}</span>
                      <span>
                        Characters: {asciiOutput.length.toLocaleString()}
                      </span>
                      <span>Type: {activeTab}</span>
                      {activeTab === "text" && (
                        <span>Font: {settings.font}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Type className="mx-auto mb-4 h-12 w-12" />
                    <p className="text-lg font-medium">
                      Your ASCII art will appear here
                    </p>
                    <p className="text-sm">
                      Enter text or upload an image to get started
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credits Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Credits & Acknowledgments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">ASCII Text Generation</h4>
              <div className="text-sm text-muted-foreground">
                <p>
                  Powered by{" "}
                  <a
                    href="https://www.figlet.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    FIGlet
                  </a>{" "}
                  - Frank, Ian, and Glen&apos;s Letters
                </p>
                <p>Original concept by Glenn Chappell & Ian Chai (1991)</p>
                <p>
                  JavaScript implementation via{" "}
                  <a
                    href="https://www.npmjs.com/package/figlet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    figlet npm package
                  </a>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Font Sources</h4>
              <div className="text-sm text-muted-foreground">
                <p>
                  Fonts downloaded from{" "}
                  <a
                    href="http://www.figlet.org/fonts/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    figlet.org/fonts/
                  </a>
                </p>
                <p>Over 180+ professional ASCII fonts available</p>
                <p>Fonts are cached locally for optimal performance</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Image Processing</h4>
              <div className="text-sm text-muted-foreground">
                <p>Custom algorithm using HTML5 Canvas API</p>
                <p>Brightness-based character mapping</p>
                <p>Support for multiple character sets</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This tool processes everything locally in
              your browser. No text or images are sent to external servers,
              ensuring your privacy and security.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </ToolsWrapper>
  );
}
