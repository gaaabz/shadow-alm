import React, { useState } from "react";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  ERC20_ABI,
  ShadowALMCompatibleABI as SHADOW_ALM_ABI,
} from "../config/ShadowALMCompatible.abi";
import { SHADOW_ALM_ADDRESS } from "../config/wagmi";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <div className="pt-6">{children}</div>}
    </div>
  );
}

export default function DepositWithdraw() {
  const { address, isConnected } = useAccount();
  const [tabValue, setTabValue] = useState(0);
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [shares, setShares] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get user's ALM share balance
  const { data: userShareBalance, refetch: refetchShareBalance } =
    useReadContract({
      address: SHADOW_ALM_ADDRESS,
      abi: SHADOW_ALM_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    });

  // Get token addresses
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

  // Get user token balances
  const { data: token0Balance, refetch: refetchToken0Balance } =
    useReadContract({
      address: token0Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    });

  const { data: token1Balance, refetch: refetchToken1Balance } =
    useReadContract({
      address: token1Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    });

  // Get token allowances
  const { data: token0Allowance, refetch: refetchToken0Allowance } =
    useReadContract({
      address: token0Address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: address ? [address, SHADOW_ALM_ADDRESS] : undefined,
    });

  const { data: token1Allowance, refetch: refetchToken1Allowance } =
    useReadContract({
      address: token1Address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: address ? [address, SHADOW_ALM_ADDRESS] : undefined,
    });

  // Contract write hooks
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
  } = useWriteContract();
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const isLoading =
    isDepositPending ||
    isWithdrawPending ||
    isApprovePending ||
    isDepositConfirming ||
    isWithdrawConfirming ||
    isApproveConfirming;

  // Refetch allowances when approval is successful
  React.useEffect(() => {
    if (isApproveSuccess) {
      refetchToken0Allowance();
      refetchToken1Allowance();
    }
  }, [isApproveSuccess, refetchToken0Allowance, refetchToken1Allowance]);

  // Trigger global refresh when deposit/withdraw is successful
  React.useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess) {
      // Refetch local balances
      refetchToken0Balance();
      refetchToken1Balance();
      refetchToken0Allowance();
      refetchToken1Allowance();
      refetchShareBalance();

      // Dispatch a custom event that other components can listen to
      window.dispatchEvent(new Event("transactionSuccess"));

      // Also clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [
    isDepositSuccess,
    isWithdrawSuccess,
    refetchToken0Balance,
    refetchToken1Balance,
    refetchToken0Allowance,
    refetchToken1Allowance,
    refetchShareBalance,
  ]);

  // Helper functions to format tokens with correct decimals
  const formatToken0Balance = (balance: bigint) => {
    if (!token0Decimals) return "0.0";
    const divisor = BigInt(10 ** token0Decimals);
    return (Number(balance) / Number(divisor)).toFixed(4);
  };

  const formatToken1Balance = (balance: bigint) => {
    if (!token1Decimals) return "0.0";
    const divisor = BigInt(10 ** token1Decimals);
    return (Number(balance) / Number(divisor)).toFixed(4);
  };

  const parseToken0Amount = (amount: string) => {
    if (!token0Decimals) return BigInt(0);
    const multiplier = BigInt(10 ** token0Decimals);
    return BigInt(Math.floor(parseFloat(amount) * Number(multiplier)));
  };

  const parseToken1Amount = (amount: string) => {
    if (!token1Decimals) return BigInt(0);
    const multiplier = BigInt(10 ** token1Decimals);
    return BigInt(Math.floor(parseFloat(amount) * Number(multiplier)));
  };

  // Check if amounts need approval
  const needsToken0Approval =
    amount0 &&
    token0Allowance !== undefined &&
    parseToken0Amount(amount0) > token0Allowance;
  const needsToken1Approval =
    amount1 &&
    token1Allowance !== undefined &&
    parseToken1Amount(amount1) > token1Allowance;

  // Check if user has sufficient balance
  const hasInsufficientToken0Balance =
    amount0 &&
    token0Balance !== undefined &&
    parseToken0Amount(amount0) > token0Balance;
  const hasInsufficientToken1Balance =
    amount1 &&
    token1Balance !== undefined &&
    parseToken1Amount(amount1) > token1Balance;

  // Check if user has sufficient shares for withdrawal
  const hasInsufficientShares =
    shares &&
    userShareBalance !== undefined &&
    parseEther(shares) > userShareBalance;

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleApprove = async (
    tokenAddress: string,
    amount: string,
    tokenSymbol: string,
    isToken0: boolean
  ) => {
    if (!address || !tokenAddress) return;

    setError(null);
    setSuccess(null);

    try {
      const parsedAmount = isToken0
        ? parseToken0Amount(amount)
        : parseToken1Amount(amount);

      writeApprove({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [SHADOW_ALM_ADDRESS, parsedAmount],
      });

      setSuccess(`${tokenSymbol} approval transaction submitted!`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${tokenSymbol} approval failed`
      );
    }
  };

  const handleDeposit = async () => {
    if (!address || !amount0.trim() || !amount1.trim()) return;

    setError(null);
    setSuccess(null);

    try {
      const parsedAmount0 = parseToken0Amount(amount0);
      const parsedAmount1 = parseToken1Amount(amount1);

      writeDeposit({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_ABI,
        functionName: "deposit",
        args: [parsedAmount0, parsedAmount1],
      });

      setSuccess(`Deposit transaction submitted!`);
      setAmount0("");
      setAmount1("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    if (!address || !shares.trim()) return;

    setError(null);
    setSuccess(null);

    try {
      writeWithdraw({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_ABI,
        functionName: "withdraw",
        args: [parseEther(shares)],
      });

      setSuccess(`Withdraw transaction submitted!`);
      setShares("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-blue-500/20 border border-blue-500/50 text-blue-100 p-4 rounded-lg">
        <p>Connect your wallet to manage liquidity</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-white/20">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange(0)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tabValue === 0
                ? "border-blue-400 text-blue-200"
                : "border-transparent text-gray-300 hover:text-white hover:border-white/30"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => handleTabChange(1)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tabValue === 1
                ? "border-blue-400 text-blue-200"
                : "border-transparent text-gray-300 hover:text-white hover:border-white/30"
            }`}
          >
            Withdraw
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mt-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg mt-4">
          {success}
        </div>
      )}

      <TabPanel value={tabValue} index={0}>
        <p className="text-gray-300 mb-4">
          Deposit tokens to receive ALM shares. The optimal ratio will be
          calculated automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-300">
                {token0Symbol || "Token0"} Amount
              </label>
              <span className="text-xs text-gray-400">
                Balance:{" "}
                {token0Balance ? formatToken0Balance(token0Balance) : "0.0"}{" "}
                {token0Symbol}
              </span>
            </div>
            <input
              type="number"
              value={amount0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount0(e.target.value)
              }
              disabled={isLoading}
              placeholder="0.0"
              className={`w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-white/5 ${
                hasInsufficientToken0Balance
                  ? "border-red-500/50"
                  : "border-white/20"
              }`}
            />
            {hasInsufficientToken0Balance && (
              <p className="text-red-300 text-xs mt-1">
                Insufficient {token0Symbol} balance
              </p>
            )}

            {needsToken0Approval && !hasInsufficientToken0Balance && (
              <button
                onClick={() =>
                  handleApprove(
                    token0Address!,
                    amount0,
                    token0Symbol || "Token0",
                    true
                  )
                }
                disabled={isLoading}
                className="w-full mt-2 bg-yellow-600 text-white py-2 px-3 rounded-md hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? "Processing..." : `Approve ${token0Symbol}`}
              </button>
            )}
          </div>

          <div className="col-span-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-300">
                {token1Symbol || "Token1"} Amount
              </label>
              <span className="text-xs text-gray-400">
                Balance:{" "}
                {token1Balance ? formatToken1Balance(token1Balance) : "0.0"}{" "}
                {token1Symbol}
              </span>
            </div>
            <input
              type="number"
              value={amount1}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount1(e.target.value)
              }
              disabled={isLoading}
              placeholder="0.0"
              className={`w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-white/5 ${
                hasInsufficientToken1Balance
                  ? "border-red-500/50"
                  : "border-white/20"
              }`}
            />
            {hasInsufficientToken1Balance && (
              <p className="text-red-300 text-xs mt-1">
                Insufficient {token1Symbol} balance
              </p>
            )}

            {needsToken1Approval && !hasInsufficientToken1Balance && (
              <button
                onClick={() =>
                  handleApprove(
                    token1Address!,
                    amount1,
                    token1Symbol || "Token1",
                    false
                  )
                }
                disabled={isLoading}
                className="w-full mt-2 bg-yellow-600 text-white py-2 px-3 rounded-md hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? "Processing..." : `Approve ${token1Symbol}`}
              </button>
            )}
          </div>

          <div className="col-span-full">
            <button
              onClick={handleDeposit}
              disabled={
                isLoading ||
                !amount0.trim() ||
                !amount1.trim() ||
                !!needsToken0Approval ||
                !!needsToken1Approval ||
                !!hasInsufficientToken0Balance ||
                !!hasInsufficientToken1Balance
              }
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : needsToken0Approval || needsToken1Approval ? (
                "Approve tokens first"
              ) : hasInsufficientToken0Balance ||
                hasInsufficientToken1Balance ? (
                "Insufficient balance"
              ) : (
                "Deposit"
              )}
            </button>
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <p className="text-gray-300 mb-4">
          Withdraw your share of the liquidity. You'll receive both tokens
          proportionally.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Shares to Withdraw
              </label>
              <span className="text-xs text-gray-400">
                Balance:{" "}
                {userShareBalance ? formatEther(userShareBalance) : "0.0"}{" "}
                shares
              </span>
            </div>
            <input
              type="number"
              value={shares}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setShares(e.target.value)
              }
              disabled={isLoading}
              placeholder="0.0"
              className={`w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-white/5 ${
                hasInsufficientShares ? "border-red-500/50" : "border-white/20"
              }`}
            />
            {hasInsufficientShares && (
              <p className="text-red-300 text-xs mt-1">
                Insufficient share balance
              </p>
            )}
            {userShareBalance && userShareBalance > 0n && (
              <button
                onClick={() => setShares(formatEther(userShareBalance))}
                className="mt-1 text-xs text-blue-300 hover:text-blue-200 underline"
              >
                Max: {formatEther(userShareBalance)} shares
              </button>
            )}
          </div>

          <div>
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !shares.trim() || !!hasInsufficientShares}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : hasInsufficientShares ? (
                "Insufficient shares"
              ) : (
                "Withdraw"
              )}
            </button>
          </div>
        </div>
      </TabPanel>
    </div>
  );
}
