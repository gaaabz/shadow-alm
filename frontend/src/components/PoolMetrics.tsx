import React, { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import {
  ERC20_ABI,
  ShadowALMCompatibleABI as SHADOW_ALM_ABI,
} from "../config/ShadowALMCompatible.abi";
import { SHADOW_ALM_ADDRESS, SHADOW_POOL_ADDRESS } from "../config/wagmi";

interface TokenPrices {
  [address: string]: number;
}

export default function PoolMetrics() {
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token addresses from ALM contract
  const { data: token0Address } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: "token0",
  });

  const { data: token1Address } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: "token1",
  });

  // Get token symbols and decimals
  const { data: token0Symbol } = useReadContract({
    address: token0Address,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  const { data: token0Decimals } = useReadContract({
    address: token0Address,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const { data: token1Symbol } = useReadContract({
    address: token1Address,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  const { data: token1Decimals } = useReadContract({
    address: token1Address,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  // Get total token amounts in the ALM contract
  const { data: totalToken0, refetch: refetchToken0 } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: "totalToken0",
  });

  const { data: totalToken1, refetch: refetchToken1 } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: "totalToken1",
  });

  // Get position info
  const { data: positionData, refetch: refetchPosition } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_ABI,
    functionName: "getPosition",
  });

  const fetchTokenPrices = React.useCallback(async () => {
    if (!token0Address || !token1Address) return;

    setLoading(true);
    setError(null);

    try {
      // For demonstration, using mock prices
      // In production, you would call a price API like CoinGecko or CoinMarketCap
      const mockPrices: TokenPrices = {
        [token0Address.toLowerCase()]: 1.0, // USDC price
        [token1Address.toLowerCase()]: 1.0, // scUSD price (also a stablecoin)
      };

      setTokenPrices(mockPrices);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch token prices"
      );
    } finally {
      setLoading(false);
    }
  }, [token0Address, token1Address]);

  useEffect(() => {
    if (token0Address && token1Address) {
      fetchTokenPrices();
      const interval = setInterval(fetchTokenPrices, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [fetchTokenPrices, token0Address, token1Address]);

  // Listen for transaction success events and refresh data
  useEffect(() => {
    const handleTransactionSuccess = () => {
      // Refresh all contract data
      refetchToken0();
      refetchToken1();
      refetchPosition();
      fetchTokenPrices();
    };

    window.addEventListener("transactionSuccess", handleTransactionSuccess);

    return () => {
      window.removeEventListener(
        "transactionSuccess",
        handleTransactionSuccess
      );
    };
  }, [refetchToken0, refetchToken1, refetchPosition, fetchTokenPrices]);

  if (loading && Object.keys(tokenPrices).length === 0) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
        Failed to load pool metrics: {error}
      </div>
    );
  }

  if (
    !positionData ||
    (totalToken0 === undefined && totalToken1 === undefined)
  ) {
    return <p className="text-gray-300">No position data available</p>;
  }

  const [currentTick, , liquidity] = positionData;

  // Helper functions to format tokens with correct decimals
  const formatToken0Amount = (amount: bigint) => {
    if (!token0Decimals) return 0;
    const divisor = BigInt(10 ** token0Decimals);
    return Number(amount) / Number(divisor);
  };

  const formatToken1Amount = (amount: bigint) => {
    if (!token1Decimals) return 0;
    const divisor = BigInt(10 ** token1Decimals);
    return Number(amount) / Number(divisor);
  };

  // Calculate current price based on token amounts (simplified)
  const token0Amount = formatToken0Amount(totalToken0 || 0n);
  const token1Amount = formatToken1Amount(totalToken1 || 0n);
  const currentPrice = token0Amount > 0 ? token1Amount / token0Amount : 0;

  // Calculate USD values
  const token0Price = tokenPrices[token0Address?.toLowerCase() || ""] || 0;
  const token1Price = tokenPrices[token1Address?.toLowerCase() || ""] || 0;

  const currentPriceUSD = currentPrice * token1Price;
  const totalLiquidityUSD =
    token0Amount * token0Price + token1Amount * token1Price;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">Current Tick</p>
        <p className="text-lg font-semibold font-mono text-white">
          {Number(currentTick).toLocaleString()}
        </p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">Current Price</p>
        <div className="space-y-1">
          <p className="text-lg font-semibold font-mono text-white">
            {currentPrice.toFixed(6)} {token0Symbol}/{token1Symbol}
          </p>
          <p className="text-sm text-green-300 font-medium">
            ${currentPriceUSD.toFixed(2)} USD
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">Total Liquidity</p>
        <div className="space-y-1">
          <p className="text-lg font-semibold font-mono text-white">
            {Number(liquidity).toExponential(2)}
          </p>
          <p className="text-sm text-green-300 font-medium">
            ${totalLiquidityUSD.toFixed(2)} USD
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4">
        <p className="text-sm text-gray-300 mb-1">Fee Tier</p>
        <p className="text-lg font-semibold text-white">0.3%</p>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:col-span-2">
        <p className="text-sm text-gray-300 mb-2">Token Holdings</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">{token0Symbol}:</span>
            <div className="text-right">
              <p className="text-sm font-mono text-white">
                {token0Amount.toFixed(4)}
              </p>
              <p className="text-xs text-green-300">
                ${(token0Amount * token0Price).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white">{token1Symbol}:</span>
            <div className="text-right">
              <p className="text-sm font-mono text-white">
                {token1Amount.toFixed(4)}
              </p>
              <p className="text-xs text-green-300">
                ${(token1Amount * token1Price).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:col-span-2">
        <p className="text-sm text-gray-300 mb-2">Contract Addresses</p>
        <div className="space-y-1">
          <p className="text-xs font-mono text-white">
            ALM: {SHADOW_ALM_ADDRESS.slice(0, 10)}...
            {SHADOW_ALM_ADDRESS.slice(-8)}
          </p>
          <p className="text-xs font-mono text-white">
            Pool: {SHADOW_POOL_ADDRESS.slice(0, 10)}...
            {SHADOW_POOL_ADDRESS.slice(-8)}
          </p>
        </div>
      </div>

      {loading && (
        <div className="col-span-full flex justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}
