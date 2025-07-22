"use client";

import { useState } from "react";
import { Copy, Check, Zap } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function EthConverter() {
  const [ethValue, setEthValue] = useState("");
  const [weiValue, setWeiValue] = useState("");
  const [gweiValue, setGweiValue] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const updateFromEth = (value: string) => {
    setEthValue(value);
    if (value === "" || isNaN(parseFloat(value))) {
      setWeiValue("");
      setGweiValue("");
      return;
    }

    const ethNum = parseFloat(value);
    const wei = (ethNum * Math.pow(10, 18)).toString();
    const gwei = (ethNum * Math.pow(10, 9)).toString();

    setWeiValue(wei);
    setGweiValue(gwei);
  };

  const updateFromWei = (value: string) => {
    setWeiValue(value);
    if (value === "" || isNaN(parseFloat(value))) {
      setEthValue("");
      setGweiValue("");
      return;
    }

    const weiNum = parseFloat(value);
    const eth = (weiNum / Math.pow(10, 18)).toString();
    const gwei = (weiNum / Math.pow(10, 9)).toString();

    setEthValue(eth);
    setGweiValue(gwei);
  };

  const updateFromGwei = (value: string) => {
    setGweiValue(value);
    if (value === "" || isNaN(parseFloat(value))) {
      setEthValue("");
      setWeiValue("");
      return;
    }

    const gweiNum = parseFloat(value);
    const eth = (gweiNum / Math.pow(10, 9)).toString();
    const wei = (gweiNum * Math.pow(10, 9)).toString();

    setEthValue(eth);
    setWeiValue(wei);
  };

  const clearAll = () => {
    setEthValue("");
    setWeiValue("");
    setGweiValue("");
  };

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <h1 className="mb-2 flex items-center justify-center gap-2 text-3xl font-bold">
          <Zap className="h-8 w-8" />
          ETH / Wei / Gwei Converter
        </h1>
        <p className="text-muted-foreground">
          Convert between Ethereum units with real-time parallel updates
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex w-full flex-col gap-4">
          <div className="mb-8 grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">ETH</CardTitle>
                <CardDescription className="text-center">
                  Ether (Main Unit)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="eth-input">ETH Value</Label>
                  <div className="flex gap-2">
                    <Input
                      id="eth-input"
                      type="number"
                      placeholder="0.0"
                      value={ethValue}
                      onChange={(e) => updateFromEth(e.target.value)}
                      step="any"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ethValue, "eth")}
                      disabled={!ethValue}
                    >
                      {copiedField === "eth" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Wei</CardTitle>
                <CardDescription className="text-center">
                  Smallest Unit (10^-18 ETH)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="wei-input">Wei Value</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wei-input"
                      type="number"
                      placeholder="0"
                      value={weiValue}
                      onChange={(e) => updateFromWei(e.target.value)}
                      step="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(weiValue, "wei")}
                      disabled={!weiValue}
                    >
                      {copiedField === "wei" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Gwei</CardTitle>
                <CardDescription className="text-center">
                  Gas Unit (10^-9 ETH)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gwei-input">Gwei Value</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gwei-input"
                      type="number"
                      placeholder="0"
                      value={gweiValue}
                      onChange={(e) => updateFromGwei(e.target.value)}
                      step="any"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(gweiValue, "gwei")}
                      disabled={!gweiValue}
                    >
                      {copiedField === "gwei" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 flex justify-center">
            <Button onClick={clearAll} variant="outline">
              Clear All
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Formulas & Calculations</CardTitle>
            <CardDescription>
              Understanding Ethereum unit conversions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Basic Conversions</h3>
                <div className="space-y-2 font-mono text-sm">
                  <div>1 ETH = 10^18 Wei</div>
                  <div>1 ETH = 10^9 Gwei</div>
                  <div>1 Gwei = 10^9 Wei</div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Unit Hierarchy</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Wei:</strong> Smallest indivisible unit
                  </div>
                  <div>
                    <strong>Gwei:</strong> Common for gas prices
                  </div>
                  <div>
                    <strong>ETH:</strong> Standard user-facing unit
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold">Conversion Examples</h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <div className="font-semibold">ETH → Wei</div>
                  <div className="font-mono">
                    1 ETH = 1,000,000,000,000,000,000 Wei
                  </div>
                  <div className="text-muted-foreground">Multiply by 10^18</div>
                </div>

                <div className="rounded-lg bg-muted p-3">
                  <div className="font-semibold">ETH → Gwei</div>
                  <div className="font-mono">1 ETH = 1,000,000,000 Gwei</div>
                  <div className="text-muted-foreground">Multiply by 10^9</div>
                </div>

                <div className="rounded-lg bg-muted p-3">
                  <div className="font-semibold">Gwei → Wei</div>
                  <div className="font-mono">1 Gwei = 1,000,000,000 Wei</div>
                  <div className="text-muted-foreground">Multiply by 10^9</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold">Common Use Cases</h3>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="font-semibold text-blue-600">
                    Gas Prices (Gwei)
                  </div>
                  <div>Transaction fees are typically measured in Gwei</div>
                  <div className="mt-1 font-mono text-xs">
                    Example: 20 Gwei = fast transaction
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-green-600">
                    Smart Contracts (Wei)
                  </div>
                  <div>Precision calculations use Wei to avoid decimals</div>
                  <div className="mt-1 font-mono text-xs">
                    Example: 1000000000000000000 Wei = 1 ETH
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolsWrapper>
  );
}
