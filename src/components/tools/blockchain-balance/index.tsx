"use client";

import { toast } from "sonner";
import { useState, useCallback } from "react";
import {
  X,
  Copy,
  Plus,
  Coins,
  Search,
  Wallet,
  Network,
  Loader2,
  Settings,
  TrendingUp,
  ExternalLink,
  Github,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DEFAULT_CHAINS, DEFAULT_TOKENS } from "./utils";

import type { Chain, Balance, TokenBalance, CustomToken } from "./types";

export default function BlockchainBalance() {
  const [walletAddress, setWalletAddress] = useState("");
  const [chains, setChains] = useState<Chain[]>(DEFAULT_CHAINS);
  const [customTokens, setCustomTokens] =
    useState<CustomToken[]>(DEFAULT_TOKENS);
  const [balances, setBalances] = useState<Record<number, Balance>>({});
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("native");

  // Add chain form
  const [showAddChain, setShowAddChain] = useState(false);
  const [newChain, setNewChain] = useState({
    name: "",
    symbol: "",
    rpcUrl: "",
    chainId: "",
    explorerUrl: "",
    decimals: "18",
    icon: "⚪",
  });

  // Add token form
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({
    address: "",
    name: "",
    symbol: "",
    decimals: "18",
    selectedChains: [] as number[],
  });

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const formatBalance = (balance: string, decimals: number): string => {
    const num = parseFloat(balance) / Math.pow(10, decimals);
    return num.toFixed(6);
  };

  const fetchNativeBalance = useCallback(
    async (chain: Chain, address: string): Promise<Balance> => {
      try {
        const response = await fetch(chain.rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 1,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const balance = data.result;
        const formatted = formatBalance(
          parseInt(balance, 16).toString(),
          chain.decimals,
        );

        return {
          chainId: chain.chainId,
          balance: balance,
          formatted: formatted,
          loading: false,
        };
      } catch (error) {
        return {
          chainId: chain.chainId,
          balance: "0",
          formatted: "0.000000",
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [],
  );

  const fetchTokenBalance = useCallback(
    async (
      chain: Chain,
      address: string,
      tokenAddress: string,
    ): Promise<string> => {
      try {
        const data = `0x70a08231000000000000000000000000${address.slice(2)}`;

        const response = await fetch(chain.rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: tokenAddress,
                data: data,
              },
              "latest",
            ],
            id: 1,
          }),
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error.message);
        }

        return result.result || "0x0";
      } catch {
        return "0x0";
      }
    },
    [],
  );

  const scanAllBalances = useCallback(async () => {
    if (!isValidAddress(walletAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsScanning(true);
    setBalances({});
    setTokenBalances([]);

    const initialBalances: Record<number, Balance> = {};
    chains.forEach((chain) => {
      initialBalances[chain.chainId] = {
        chainId: chain.chainId,
        balance: "0",
        formatted: "0.000000",
        loading: true,
      };
    });
    setBalances(initialBalances);

    const balancePromises = chains.map(async (chain) => {
      const balance = await fetchNativeBalance(chain, walletAddress);
      setBalances((prev) => ({
        ...prev,
        [chain.chainId]: balance,
      }));
      return { chainId: chain.chainId, balance };
    });

    const tokenPromises = chains.flatMap((chain) =>
      customTokens
        .filter((token) => token.chainIds.includes(chain.chainId))
        .map(async (token) => {
          const balance = await fetchTokenBalance(
            chain,
            walletAddress,
            token.address,
          );
          const balanceInt = parseInt(balance, 16);

          if (balanceInt > 0) {
            return {
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              balance: balance,
              formatted: formatBalance(balanceInt.toString(), token.decimals),
              decimals: token.decimals,
              chainId: chain.chainId,
              chainName: chain.name,
            };
          }
          return null;
        }),
    );

    try {
      await Promise.all(balancePromises);
      const tokens = await Promise.all(tokenPromises);
      setTokenBalances(tokens.filter(Boolean) as TokenBalance[]);
    } catch {
      toast.error("Error scanning balances");
    } finally {
      setIsScanning(false);
    }
  }, [
    walletAddress,
    chains,
    customTokens,
    fetchNativeBalance,
    fetchTokenBalance,
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const addCustomChain = () => {
    if (
      !newChain.name ||
      !newChain.symbol ||
      !newChain.rpcUrl ||
      !newChain.chainId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const chainId = parseInt(newChain.chainId);
    if (chains.some((c) => c.chainId === chainId)) {
      toast.error("Chain ID already exists");
      return;
    }

    const customChain: Chain = {
      id: `custom-${chainId}`,
      name: newChain.name,
      symbol: newChain.symbol,
      rpcUrl: newChain.rpcUrl,
      chainId: chainId,
      explorerUrl: newChain.explorerUrl,
      decimals: parseInt(newChain.decimals),
      icon: newChain.icon,
      isCustom: true,
    };

    setChains([...chains, customChain]);
    setNewChain({
      name: "",
      symbol: "",
      rpcUrl: "",
      chainId: "",
      explorerUrl: "",
      decimals: "18",
      icon: "⚪",
    });
    setShowAddChain(false);
    toast.success("Custom chain added successfully");
  };

  const addCustomToken = () => {
    if (
      !newToken.address ||
      !newToken.name ||
      !newToken.symbol ||
      newToken.selectedChains.length === 0
    ) {
      toast.error(
        "Please fill all required fields and select at least one chain",
      );
      return;
    }

    if (!isValidAddress(newToken.address)) {
      toast.error("Please enter a valid token address");
      return;
    }

    const customToken: CustomToken = {
      address: newToken.address,
      name: newToken.name,
      symbol: newToken.symbol,
      decimals: parseInt(newToken.decimals),
      chainIds: newToken.selectedChains,
    };

    setCustomTokens([...customTokens, customToken]);
    setNewToken({
      address: "",
      name: "",
      symbol: "",
      decimals: "18",
      selectedChains: [],
    });
    setShowAddToken(false);
    toast.success("Custom token added successfully");
  };

  const removeCustomChain = (chainId: number) => {
    setChains(chains.filter((c) => c.chainId !== chainId || !c.isCustom));
    toast.success("Custom chain removed");
  };

  const removeCustomToken = (index: number) => {
    const newTokens = [...customTokens];
    newTokens.splice(index, 1);
    setCustomTokens(newTokens);
    toast.success("Custom token removed");
  };

  const ChainList = () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {chains.map((chain) => (
        <div key={chain.id} className="group relative">
          <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-background to-muted/30 p-4 transition-all duration-200 hover:shadow-md">
            <span className="text-2xl">{chain.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{chain.name}</p>
              <p className="text-xs text-muted-foreground">{chain.symbol}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {chain.chainId}
            </Badge>
          </div>
          {chain.isCustom && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => removeCustomChain(chain.chainId)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}

      <div
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 transition-colors hover:border-primary/50 hover:bg-muted/30"
        onClick={() => setShowAddChain(true)}
      >
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">Add Chain</span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-1 text-center text-3xl font-bold md:gap-3 md:text-4xl">
          <Coins className="h-10 w-10" />
          Blockchain Balances
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
          Check native and token balances across multiple blockchain networks
          simultaneously. Enter any Ethereum address to scan balances on all
          supported chains.
        </p>
      </div>

      {/* Contribution Notice */}
      <Card className="border-2 border-blue-600 bg-blue-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Github className="h-5 w-5" />
            Want to Add More Chains or Tokens?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-blue-800 dark:text-blue-200">
              🚀 Help make this tool even better! You can add custom chains and
              tokens using the forms above, or contribute to make them available
              for everyone.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                onClick={() =>
                  window.open(
                    "https://github.com/truethari/OpensourceToolkit/issues",
                    "_blank",
                  )
                }
              >
                <Github className="mr-2 h-4 w-4" />
                Open Issue
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                onClick={() =>
                  window.open(
                    "https://github.com/truethari/OpensourceToolkit",
                    "_blank",
                  )
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Repository
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-6 w-6" />
            Wallet Address Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Enter wallet address (0x...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="h-12 font-mono text-base"
              />
              {walletAddress && !isValidAddress(walletAddress) && (
                <p className="mt-1 text-sm text-red-500">
                  Please enter a valid Ethereum address
                </p>
              )}
            </div>
            <Button
              onClick={scanAllBalances}
              disabled={isScanning || !walletAddress}
              className="h-12 min-w-[140px] text-base"
              size="lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Scan All Chains
                </>
              )}
            </Button>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Network className="h-5 w-5" />
              Available Networks ({chains.length})
            </h3>
            <ChainList />
          </div>
        </CardContent>
      </Card>

      {/* Add Chain Modal */}
      {showAddChain && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <CardContent className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center justify-between">
                Add Custom Chain
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddChain(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="chain-name">Name</Label>
                <Input
                  id="chain-name"
                  value={newChain.name}
                  onChange={(e) =>
                    setNewChain({ ...newChain, name: e.target.value })
                  }
                  placeholder="Ethereum"
                />
              </div>
              <div>
                <Label htmlFor="chain-symbol">Symbol</Label>
                <Input
                  id="chain-symbol"
                  value={newChain.symbol}
                  onChange={(e) =>
                    setNewChain({ ...newChain, symbol: e.target.value })
                  }
                  placeholder="ETH"
                />
              </div>
              <div>
                <Label htmlFor="chain-id">Chain ID</Label>
                <Input
                  id="chain-id"
                  type="number"
                  value={newChain.chainId}
                  onChange={(e) =>
                    setNewChain({ ...newChain, chainId: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="rpc-url">RPC URL</Label>
                <Input
                  id="rpc-url"
                  value={newChain.rpcUrl}
                  onChange={(e) =>
                    setNewChain({ ...newChain, rpcUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="explorer-url">Explorer URL</Label>
                <Input
                  id="explorer-url"
                  value={newChain.explorerUrl}
                  onChange={(e) =>
                    setNewChain({ ...newChain, explorerUrl: e.target.value })
                  }
                  placeholder="https://etherscan.io"
                />
              </div>
              <div>
                <Label htmlFor="chain-icon">Icon</Label>
                <Input
                  id="chain-icon"
                  value={newChain.icon}
                  onChange={(e) =>
                    setNewChain({ ...newChain, icon: e.target.value })
                  }
                  placeholder="🔷"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddChain(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomChain}>Add Chain</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Token Modal */}
      {showAddToken && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <CardContent className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center justify-between">
                Add Custom Token
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddToken(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="token-address">Address</Label>
                <Input
                  id="token-address"
                  value={newToken.address}
                  onChange={(e) =>
                    setNewToken({ ...newToken, address: e.target.value })
                  }
                  className="font-mono"
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label htmlFor="token-name">Name</Label>
                <Input
                  id="token-name"
                  value={newToken.name}
                  onChange={(e) =>
                    setNewToken({ ...newToken, name: e.target.value })
                  }
                  placeholder="Tether USD"
                />
              </div>
              <div>
                <Label htmlFor="token-symbol">Symbol</Label>
                <Input
                  id="token-symbol"
                  value={newToken.symbol}
                  onChange={(e) =>
                    setNewToken({ ...newToken, symbol: e.target.value })
                  }
                  placeholder="USDT"
                />
              </div>
              <div>
                <Label htmlFor="token-decimals">Decimals</Label>
                <Input
                  id="token-decimals"
                  type="number"
                  value={newToken.decimals}
                  onChange={(e) =>
                    setNewToken({ ...newToken, decimals: e.target.value })
                  }
                  placeholder="18"
                />
              </div>
              <div>
                <Label>Select Chains</Label>
                <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded border p-2">
                  {chains.map((chain) => (
                    <div
                      key={chain.chainId}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`chain-${chain.chainId}`}
                        checked={newToken.selectedChains.includes(
                          chain.chainId,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewToken({
                              ...newToken,
                              selectedChains: [
                                ...newToken.selectedChains,
                                chain.chainId,
                              ],
                            });
                          } else {
                            setNewToken({
                              ...newToken,
                              selectedChains: newToken.selectedChains.filter(
                                (id) => id !== chain.chainId,
                              ),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`chain-${chain.chainId}`}
                        className="text-sm"
                      >
                        {chain.icon} {chain.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddToken(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomToken}>Add Token</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(balances).length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex flex-col gap-2">
            <TabsList className="grid h-12 w-full grid-cols-2 md:grid-cols-3">
              <TabsTrigger value="native" className="text-base">
                Native Balances
              </TabsTrigger>
              <TabsTrigger value="tokens" className="text-base">
                Token Balances
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="hidden text-base md:block"
              >
                Portfolio Overview
              </TabsTrigger>
            </TabsList>

            <TabsList className="grid h-12 w-full grid-cols-1 md:hidden">
              <TabsTrigger value="portfolio" className="text-base">
                Portfolio Overview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="native" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Native Token Balances</h2>
              <Badge variant="outline" className="text-sm">
                {chains.length} Networks
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chains.map((chain) => {
                const balance = balances[chain.chainId];
                if (!balance) return null;

                return (
                  <Card
                    key={chain.id}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{chain.icon}</span>
                          <div>
                            <h3 className="text-lg font-bold">{chain.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Chain ID: {chain.chainId}
                            </p>
                          </div>
                        </div>
                        {chain.isCustom && (
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        {balance.loading ? (
                          <div className="flex items-center justify-center gap-2 py-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading balance...</span>
                          </div>
                        ) : balance.error ? (
                          <div className="py-4 text-center">
                            <Badge variant="destructive">
                              Connection Error
                            </Badge>
                          </div>
                        ) : (
                          <>
                            <div className="text-center">
                              <p className="font-mono text-2xl font-bold">
                                {balance.formatted}
                              </p>
                              <p className="text-lg text-muted-foreground">
                                {chain.symbol}
                              </p>
                              {balance.usdValue && (
                                <p className="text-sm font-medium text-green-600">
                                  ${balance.usdValue.toFixed(2)}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() =>
                                  copyToClipboard(balance.formatted)
                                }
                              >
                                <Copy className="mr-1 h-4 w-4" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() =>
                                  window.open(
                                    `${chain.explorerUrl}/address/${walletAddress}`,
                                    "_blank",
                                  )
                                }
                              >
                                <ExternalLink className="mr-1 h-4 w-4" />
                                Explorer
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <div className="flex flex-col justify-between md:flex-row md:items-center">
              <h2 className="text-xl font-semibold">ERC20 Token Balances</h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-sm">
                  {tokenBalances.length} Tokens Found
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddToken(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Token
                </Button>
              </div>
            </div>

            {tokenBalances.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="space-y-3">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">
                      {isScanning
                        ? "Scanning for token balances..."
                        : "No token balances found"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adding custom tokens or check a different wallet
                      address
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tokenBalances.map((token, index) => (
                  <Card
                    key={index}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/30">
                            <span className="text-sm font-bold">
                              {token.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">{token.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {token.symbol} • {token.chainName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="font-mono text-2xl font-bold">
                            {token.formatted}
                          </p>
                          <p className="text-lg text-muted-foreground">
                            {token.symbol}
                          </p>
                          {token.usdValue && (
                            <p className="text-sm font-medium text-green-600">
                              ${token.usdValue.toFixed(2)}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => copyToClipboard(token.formatted)}
                          >
                            <Copy className="mr-1 h-4 w-4" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const chain = chains.find(
                                (c) => c.chainId === token.chainId,
                              );
                              if (chain) {
                                window.open(
                                  `${chain.explorerUrl}/token/${token.address}?a=${walletAddress}`,
                                  "_blank",
                                );
                              }
                            }}
                          >
                            <ExternalLink className="mr-1 h-4 w-4" />
                            Explorer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Settings className="h-5 w-5" />
                  Tracked Tokens ({customTokens.length})
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customTokens.map((token, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-background to-muted/30 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {token.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {token.symbol} • {token.chainIds.length} chains
                        </p>
                      </div>
                    </div>
                    {index >= 3 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeCustomToken(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center gap-3">
                    <Network className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Total Networks
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {chains.length}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {chains.filter((c) => c.isCustom).length} custom
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-950 dark:to-green-900">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Active Balances
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {
                      Object.values(balances).filter(
                        (b) => parseFloat(b.formatted) > 0,
                      ).length
                    }
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    with balance &gt; 0
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center gap-3">
                    <Coins className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      Token Holdings
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {tokenBalances.length}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    ERC20 tokens found
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-950 dark:to-orange-900">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                      Tracked Tokens
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    {customTokens.length}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    in watchlist
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-semibold">Supported Networks</h3>
              <ChainList />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
