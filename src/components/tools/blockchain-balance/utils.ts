import type { Chain, CustomToken } from "./types";

/**
 * Default blockchain networks supported by the Blockchain Balance tool.
 *
 * 🚀 Want to add more chains or tokens as defaults?
 * Please open an issue or submit a pull request to our GitHub repository:
 * https://github.com/truethari/OpensourceToolkit
 *
 * Your contributions help make this tool better for everyone! 💪
 */
export const DEFAULT_CHAINS: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    chainId: 1,
    explorerUrl: "https://etherscan.io",
    decimals: 18,
    icon: "🔷",
  },
  {
    id: "bsc",
    name: "BNB Smart Chain",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org",
    chainId: 56,
    explorerUrl: "https://bscscan.com",
    decimals: 18,
    icon: "🟡",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    rpcUrl: "https://polygon-rpc.com",
    chainId: 137,
    explorerUrl: "https://polygonscan.com",
    decimals: 18,
    icon: "🟣",
  },
  {
    id: "arbitrum",
    name: "Arbitrum One",
    symbol: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    explorerUrl: "https://arbiscan.io",
    decimals: 18,
    icon: "🔵",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "ETH",
    rpcUrl: "https://mainnet.optimism.io",
    chainId: 10,
    explorerUrl: "https://optimistic.etherscan.io",
    decimals: 18,
    icon: "🔴",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    chainId: 43114,
    explorerUrl: "https://snowtrace.io",
    decimals: 18,
    icon: "🏔️",
  },
  {
    id: "fantom",
    name: "Fantom",
    symbol: "FTM",
    rpcUrl: "https://rpc.ftm.tools",
    chainId: 250,
    explorerUrl: "https://ftmscan.com",
    decimals: 18,
    icon: "👻",
  },
  {
    id: "base",
    name: "Base",
    symbol: "ETH",
    rpcUrl: "https://mainnet.base.org",
    chainId: 8453,
    explorerUrl: "https://basescan.org",
    decimals: 18,
    icon: "🟦",
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    symbol: "HYPE",
    rpcUrl: "https://rpc.hyperliquid.xyz/evm",
    chainId: 999,
    explorerUrl: "https://hyperliquid.cloud.blockscout.com",
    decimals: 18,
    icon: "💧",
  },
  {
    id: "cronos",
    name: "Cronos",
    symbol: "CRO",
    rpcUrl: "https://evm.cronos.org",
    chainId: 25,
    explorerUrl: "https://cronoscan.com",
    decimals: 18,
    icon: "🔷",
  },
  {
    id: "abstract",
    name: "Abstract",
    symbol: "ETH",
    rpcUrl: "https://api.mainnet.abs.xyz",
    chainId: 2741,
    explorerUrl: "https://abscan.org",
    decimals: 18,
    icon: "🔶",
  },
];

/**
 * Default ERC20 tokens tracked across multiple chains.
 *
 * 💡 Want to suggest additional popular tokens?
 * Open an issue or create a pull request at:
 * https://github.com/truethari/OpensourceToolkit
 */
export const DEFAULT_TOKENS: CustomToken[] = [
  {
    address: "0xA0b86a33E6441c636c34F52A12d71a7e1AB04c0c",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    chainIds: [1, 56, 137, 42161, 10, 43114],
  },
  {
    address: "0xB31A4974C0e5E0B1B94B15F32F70b75Dfdb1E8FE",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    chainIds: [1, 56, 137, 42161, 10, 43114, 8453],
  },
  {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    chainIds: [1, 137, 42161, 10],
  },
];
