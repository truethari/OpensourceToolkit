"use client";

import React, { useState, useCallback } from "react";
import {
  Copy,
  RefreshCw,
  Check,
  FileText,
  Download,
  Settings,
  Hash,
  Globe,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

// Classic Lorem Ipsum text
const loremWords = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "at",
  "vero",
  "eos",
  "accusamus",
  "accusantium",
  "doloremque",
  "laudantium",
  "totam",
  "rem",
  "aperiam",
  "eaque",
  "ipsa",
  "quae",
  "ab",
  "illo",
  "inventore",
  "veritatis",
  "architecto",
  "beatae",
  "vitae",
  "dicta",
  "sunt",
  "explicabo",
  "nemo",
  "ipsam",
  "quia",
  "voluptas",
  "aspernatur",
  "aut",
  "odit",
  "fugit",
  "quo",
  "voluptatem",
  "quia",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipisci",
];

const alternativeWords = {
  english: [
    "the",
    "quick",
    "brown",
    "fox",
    "jumps",
    "over",
    "lazy",
    "dog",
    "pack",
    "my",
    "box",
    "with",
    "five",
    "dozen",
    "liquor",
    "jugs",
    "amazingly",
    "few",
    "discotheques",
    "provide",
    "jukeboxes",
    "sphinx",
    "of",
    "black",
    "quartz",
    "judge",
    "vow",
    "waltz",
    "bad",
    "nymph",
    "for",
    "quiz",
    "bright",
    "vixens",
    "jump",
    "dozy",
    "fowl",
    "quest",
    "pack",
    "jinxed",
    "grabs",
    "when",
    "zombies",
    "arrived",
    "then",
    "we",
    "quickly",
    "boxed",
    "and",
    "moved",
    "our",
    "families",
  ],
  spanish: [
    "el",
    "rápido",
    "zorro",
    "marrón",
    "salta",
    "sobre",
    "el",
    "perro",
    "perezoso",
    "empaca",
    "mi",
    "caja",
    "con",
    "cinco",
    "docenas",
    "de",
    "jarras",
    "de",
    "licor",
    "increíblemente",
    "pocas",
    "discotecas",
    "proporcionan",
    "máquinas",
    "de",
    "discos",
    "esfinge",
    "de",
    "cuarzo",
    "negro",
    "juzga",
    "mi",
    "voto",
    "vals",
    "malo",
    "ninfa",
  ],
  french: [
    "le",
    "rapide",
    "renard",
    "brun",
    "saute",
    "par-dessus",
    "le",
    "chien",
    "paresseux",
    "emballe",
    "ma",
    "boîte",
    "avec",
    "cinq",
    "douzaines",
    "de",
    "cruches",
    "de",
    "liqueur",
    "étonnamment",
    "peu",
    "de",
    "discothèques",
    "fournissent",
    "des",
    "juke-boxes",
    "sphinx",
    "de",
    "quartz",
    "noir",
    "juge",
    "mon",
    "serment",
    "valse",
    "mauvaise",
    "nymphe",
  ],
};

export default function LoremIpsumGenerator() {
  const [generatedText, setGeneratedText] = useState("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [textType, setTextType] = useState("paragraphs");
  const [language, setLanguage] = useState("latin");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [htmlTag, setHtmlTag] = useState("p");
  const [customLength, setCustomLength] = useState(50);

  const copyToClipboard = async (text: string, item: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const getRandomWords = useCallback(
    (wordList: string[], count: number): string[] => {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(wordList[Math.floor(Math.random() * wordList.length)]);
      }
      return words;
    },
    [],
  );

  const generateSentence = useCallback(
    (wordList: string[], minWords = 4, maxWords = 18): string => {
      const wordCount =
        Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
      const words = getRandomWords(wordList, wordCount);
      const sentence = words.join(" ");
      return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
    },
    [getRandomWords],
  );

  const generateParagraph = useCallback(
    (wordList: string[], sentenceCount = 4): string => {
      const sentences = [];
      for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence(wordList));
      }
      return sentences.join(" ");
    },
    [generateSentence],
  );

  const generateText = useCallback(() => {
    let wordList = loremWords;

    if (language === "english") {
      wordList = alternativeWords.english;
    } else if (language === "spanish") {
      wordList = alternativeWords.spanish;
    } else if (language === "french") {
      wordList = alternativeWords.french;
    }

    let result = "";

    if (textType === "words") {
      const words = getRandomWords(wordList, count);
      if (startWithLorem && language === "latin" && count > 0) {
        words[0] = "Lorem";
        if (count > 1) words[1] = "ipsum";
      }
      result = words.join(" ");
    } else if (textType === "sentences") {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        let sentence = generateSentence(wordList);
        if (i === 0 && startWithLorem && language === "latin") {
          sentence = "Lorem ipsum " + sentence.toLowerCase();
        }
        sentences.push(sentence);
      }
      result = sentences.join(" ");
    } else if (textType === "paragraphs") {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        let paragraph = generateParagraph(
          wordList,
          Math.floor(Math.random() * 4) + 3,
        );
        if (i === 0 && startWithLorem && language === "latin") {
          paragraph =
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
            paragraph;
        }
        paragraphs.push(paragraph);
      }
      result = paragraphs.join("\n\n");
    } else if (textType === "custom") {
      const words = getRandomWords(wordList, customLength);
      if (startWithLorem && language === "latin" && customLength > 0) {
        words[0] = "Lorem";
        if (customLength > 1) words[1] = "ipsum";
      }
      result = words.join(" ");
    }

    if (includeHtml && result) {
      if (textType === "paragraphs") {
        result = result
          .split("\n\n")
          .map((p) => `<${htmlTag}>${p}</${htmlTag}>`)
          .join("\n");
      } else {
        result = `<${htmlTag}>${result}</${htmlTag}>`;
      }
    }

    setGeneratedText(result);
  }, [
    count,
    textType,
    language,
    startWithLorem,
    includeHtml,
    htmlTag,
    customLength,
    getRandomWords,
    generateSentence,
    generateParagraph,
  ]);

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTextStats = (text: string) => {
    if (!text) return { characters: 0, words: 0, sentences: 0, paragraphs: 0 };

    return {
      characters: text.length,
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      sentences: text.trim()
        ? text.split(/[.!?]+/).filter((s) => s.trim()).length
        : 0,
      paragraphs: text.trim()
        ? text.split(/\n\s*\n/).filter((p) => p.trim()).length
        : 0,
    };
  };

  const stats = getTextStats(generatedText);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Lorem Ipsum Generator</h1>
        <p className="text-muted-foreground">
          Generate placeholder text for your designs and layouts with
          customizable options
        </p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="generator">Text Generator</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="stats" className="hidden md:block">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsList className="mt-2 grid w-full grid-cols-1 md:hidden">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lorem Ipsum Generator
              </CardTitle>
              <CardDescription>
                Generate placeholder text in various formats and lengths
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="text-type">Text Type</Label>
                  <Select value={textType} onValueChange={setTextType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="words">Words</SelectItem>
                      <SelectItem value="sentences">Sentences</SelectItem>
                      <SelectItem value="paragraphs">Paragraphs</SelectItem>
                      <SelectItem value="custom">Custom Length</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">
                    {textType === "custom" ? "Word Count" : "Count"}
                  </Label>
                  {textType === "custom" ? (
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={customLength}
                      onChange={(e) =>
                        setCustomLength(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                    />
                  ) : (
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={count}
                      onChange={(e) =>
                        setCount(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latin">Latin (Classic)</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={generateText}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Text
                </Button>
                {generatedText && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(generatedText, "generated")
                      }
                    >
                      {copiedItem === "generated" ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy Text
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadAsFile(generatedText, "lorem-ipsum.txt")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </>
                )}
              </div>

              {generatedText && (
                <div className="space-y-2">
                  <Label>Generated Text</Label>
                  <Textarea
                    value={generatedText}
                    readOnly
                    rows={12}
                    className="font-mono"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Generation Options
              </CardTitle>
              <CardDescription>
                Customize how your Lorem Ipsum text is generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="start-lorem"
                    checked={startWithLorem}
                    onChange={(e) => setStartWithLorem(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="start-lorem">
                    Start with &apos;Lorem ipsum&apos; (Latin only)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-html"
                    checked={includeHtml}
                    onChange={(e) => setIncludeHtml(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="include-html">Wrap with HTML tags</Label>
                </div>

                {includeHtml && (
                  <div className="space-y-2">
                    <Label htmlFor="html-tag">HTML Tag</Label>
                    <Select value={htmlTag} onValueChange={setHtmlTag}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p">Paragraph (&lt;p&gt;)</SelectItem>
                        <SelectItem value="div">
                          Division (&lt;div&gt;)
                        </SelectItem>
                        <SelectItem value="span">
                          Span (&lt;span&gt;)
                        </SelectItem>
                        <SelectItem value="h1">
                          Heading 1 (&lt;h1&gt;)
                        </SelectItem>
                        <SelectItem value="h2">
                          Heading 2 (&lt;h2&gt;)
                        </SelectItem>
                        <SelectItem value="h3">
                          Heading 3 (&lt;h3&gt;)
                        </SelectItem>
                        <SelectItem value="article">
                          Article (&lt;article&gt;)
                        </SelectItem>
                        <SelectItem value="section">
                          Section (&lt;section&gt;)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold">Current Settings</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Text Type: <span className="font-mono">{textType}</span>
                  </div>
                  <div>
                    Language: <span className="font-mono">{language}</span>
                  </div>
                  <div>
                    Count:{" "}
                    <span className="font-mono">
                      {textType === "custom" ? customLength : count}
                    </span>
                  </div>
                  <div>
                    Start with Lorem:{" "}
                    <span className="font-mono">
                      {startWithLorem ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    HTML Formatting:{" "}
                    <span className="font-mono">
                      {includeHtml ? `Yes (${htmlTag})` : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Text Statistics
              </CardTitle>
              <CardDescription>Analysis of the generated text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedText ? (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">
                        {stats.characters}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Characters
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">{stats.words}</div>
                      <div className="text-sm text-muted-foreground">Words</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">
                        {stats.sentences}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sentences
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">
                        {stats.paragraphs}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Paragraphs
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Reading Time</h4>
                      <div className="text-sm text-muted-foreground">
                        Average: ~{Math.ceil(stats.words / 200)} minute
                        {Math.ceil(stats.words / 200) !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Speaking Time</h4>
                      <div className="text-sm text-muted-foreground">
                        Average: ~{Math.ceil(stats.words / 130)} minute
                        {Math.ceil(stats.words / 130) !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Generate some text to see statistics
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            About Lorem Ipsum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">What is Lorem Ipsum?</h4>
              <div className="space-y-2 text-sm">
                <p>
                  Lorem Ipsum is placeholder text commonly used in the printing
                  and typesetting industry. It has been the industry&apos;s
                  standard dummy text since the 1500s.
                </p>
                <p>
                  The text is derived from sections 1.10.32 and 1.10.33 of
                  &apos;de Finibus Bonorum et Malorum&apos; by Cicero, written
                  in 45 BC.
                </p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Web Design:</strong> Fill content areas during design
                </div>
                <div>
                  <strong>Print Design:</strong> Layout testing and mockups
                </div>
                <div>
                  <strong>Typography:</strong> Font and text testing
                </div>
                <div>
                  <strong>Development:</strong> Testing text-heavy components
                </div>
                <div>
                  <strong>Presentations:</strong> Placeholder content for slides
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
