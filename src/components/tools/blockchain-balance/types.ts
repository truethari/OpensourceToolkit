export interface Chain {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
  decimals: number;
  icon: string;
  isCustom?: boolean;
}

export interface Balance {
  chainId: number;
  balance: string;
  formatted: string;
  usdValue?: number;
  loading: boolean;
  error?: string;
}

export interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  formatted: string;
  decimals: number;
  usdValue?: number;
  chainId: number;
  chainName: string;
}

export interface CustomToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainIds: number[];
}
