"use client";

import { useState } from "react";
import { Wallet, Check, Copy, Coffee, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Donations() {
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
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* Crypto wallets */}
      <div className="mt-4 flex flex-col items-center space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">Support with crypto</span>
        </div>

        <div className="flex flex-col items-center gap-2 md:flex-row md:items-start">
          <div className="w-full max-w-md space-y-1">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  EVM Address
                </span>
                <code className="truncate font-mono text-[10px] md:text-sm">
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

          <div className="mt-2 w-full max-w-md md:mt-0">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  USDT: TRX - Tron (TRC20)
                </span>
                <code className="truncate font-mono text-[10px] md:text-sm">
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
          </div>
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
  );
}
