"use client";

import { useState } from "react";
import {
  Star,
  Palette,
  Github,
  Heart,
  GitFork,
  Scale,
  ExternalLink,
  Coffee,
  Wallet,
  Check,
  Copy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Footer() {
  const [copiedEVM, setCopiedEVM] = useState(false);
  const [copiedTRX, setCopiedTRX] = useState(false);

  const copyToClipboard = async (address: string, type: "EVM" | "TRX") => {
    try {
      await navigator.clipboard.writeText(address);

      if (type === "EVM") {
        setCopiedEVM(true);
        setTimeout(() => setCopiedEVM(false), 2000);
      } else if (type === "TRX") {
        setCopiedTRX(true);
        setTimeout(() => setCopiedTRX(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      {/* Open Source Section */}
      <div className="space-y-6">
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
          <CardContent className="p-8">
            <div className="space-y-4 text-center md:space-y-6">
              <div className="flex flex-col items-center justify-center gap-2 space-x-3 md:flex-row md:gap-1">
                <div className="rounded-full bg-slate-700 p-3">
                  <Github className="aspect-square h-6 text-white md:h-8" />
                </div>
                <h2 className="text-3xl font-bold">Open Source & Community</h2>
              </div>

              <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-lg">
                OpenSource Toolkit is built by developers, for developers. Join
                our community and help us create the best collection of
                developer utilities.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-6">
                {/* GitHub */}
                <Card className="border transition-colors hover:border-slate-600">
                  <CardContent className="space-y-4 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-black dark:bg-white">
                      <Github className="h-6 w-6 text-white dark:text-black" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">View Source Code</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Explore the codebase, report issues, and contribute to
                        the project on GitHub.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          window.open(
                            "https://github.com/truethari/OpensourceToolkit",
                            "_blank",
                          )
                        }
                      >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub Repository
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Contribute */}
                <Card className="border transition-colors hover:border-slate-600">
                  <CardContent className="space-y-4 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                      <GitFork className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Contribute</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Add new tools, fix bugs, improve documentation, or
                        suggest features.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          window.open(
                            "https://github.com/truethari/OpensourceToolkit/blob/master/CONTRIBUTING.md",
                            "_blank",
                          )
                        }
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        How to Contribute
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* License */}
                <Card className="border transition-colors hover:border-slate-600">
                  <CardContent className="space-y-4 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                      <Scale className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">MIT License</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Free to use, modify, and distribute. Open source
                        software for everyone.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          window.open(
                            "https://github.com/truethari/OpensourceToolkit/blob/master/LICENSE",
                            "_blank",
                          )
                        }
                      >
                        <Scale className="mr-2 h-4 w-4" />
                        View License
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 border-t pt-6">
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Star className="h-3 w-3" />
                  <span>Star on GitHub</span>
                </Badge>
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <GitFork className="h-3 w-3" />
                  <span>Fork & Contribute</span>
                </Badge>
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Heart className="h-3 w-3" />
                  <span>Made with ❤️ by Community</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 py-8">
        {/* Crypto wallets */}
        <div className="mt-4 flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Support with crypto</span>
          </div>

          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  EVM Address
                </span>
                <code className="truncate font-mono text-xs md:text-sm">
                  0x04F92fFd52373D40956f656DD72Fcb302c000000
                </code>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    "0x04F92fFd52373D40956f656DD72Fcb302c000000",
                    "EVM",
                  )
                }
                className="ml-3 flex-shrink-0 rounded-md p-2 transition-colors hover:bg-muted"
                title={copiedEVM ? "Copied!" : "Copy address"}
              >
                {copiedEVM ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Supports any EVM chain (Ethereum, Polygon, etc.)
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  USDT: TRX - Tron (TRC20)
                </span>
                <code className="truncate font-mono text-xs md:text-sm">
                  TKRy3Dxj8LmVea8krF7UkjUcKpVn3EXtns
                </code>
              </div>

              <button
                onClick={() =>
                  copyToClipboard("TKRy3Dxj8LmVea8krF7UkjUcKpVn3EXtns", "TRX")
                }
                className="ml-3 flex-shrink-0 rounded-md p-2 transition-colors hover:bg-muted"
                title={copiedTRX ? "Copied!" : "Copy address"}
              >
                {copiedTRX ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Supports any EVM chain (Ethereum, Polygon, etc.)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="flex items-center space-x-2 border-yellow-300 bg-yellow-50 text-yellow-800 hover:border-yellow-400 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 dark:hover:bg-yellow-900"
          onClick={() => window.open("https://coff.ee/truethari", "_blank")}
        >
          <Coffee className="h-4 w-4" />
          <span>Buy me a coffee</span>
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Footer */}
      <div className="rounded-lg border-t pb-4 pt-8 text-center md:pb-0">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">More Tools Coming Soon</h3>
          <p className="text-muted-foreground">
            We&apos;re constantly adding new developer utilities. Stay tuned for
            more powerful tools!
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Palette className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-muted-foreground">
              Built with modern design principles
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
