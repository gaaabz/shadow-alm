import React from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SHADOW_ALM_ADDRESS } from "../config/wagmi";
import { formatEther } from "viem";

// ABI for the new V2 contract with emissions
const SHADOW_ALM_V2_ABI = [
  {
    inputs: [],
    name: "isStaked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalEmissions",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPendingEmissions",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastEmissionsClaim",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakePosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unstakePosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimEmissions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }, { internalType: "address", name: "account", type: "address" }],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "EXECUTOR_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function EmissionsPanel() {
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Read contract data
  const { data: isStaked, refetch: refetchIsStaked } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_V2_ABI,
    functionName: "isStaked",
  });

  const { data: totalEmissions, refetch: refetchTotalEmissions } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_V2_ABI,
    functionName: "getTotalEmissions",
  });

  const { data: pendingEmissions, refetch: refetchPendingEmissions } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_V2_ABI,
    functionName: "getPendingEmissions",
  });

  const { data: lastClaim, refetch: refetchLastClaim } = useReadContract({
    address: SHADOW_ALM_ADDRESS,
    abi: SHADOW_ALM_V2_ABI,
    functionName: "lastEmissionsClaim",
  });

  // Write contract functions
  const { data: stakeHash, writeContract: stakePosition } = useWriteContract();
  const { data: unstakeHash, writeContract: unstakePosition } = useWriteContract();
  const { data: claimHash, writeContract: claimEmissions } = useWriteContract();

  // Wait for transactions
  const { isLoading: isStaking } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });

  const { isLoading: isUnstaking } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });

  const { isLoading: isClaiming } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  React.useEffect(() => {
    setIsProcessing(isStaking || isUnstaking || isClaiming);
  }, [isStaking, isUnstaking, isClaiming]);

  // Refresh data on transaction success
  React.useEffect(() => {
    const handleTransactionSuccess = () => {
      refetchIsStaked();
      refetchTotalEmissions();
      refetchPendingEmissions();
      refetchLastClaim();
    };

    window.addEventListener("transactionSuccess", handleTransactionSuccess);
    return () => {
      window.removeEventListener("transactionSuccess", handleTransactionSuccess);
    };
  }, [refetchIsStaked, refetchTotalEmissions, refetchPendingEmissions, refetchLastClaim]);

  const handleStake = async () => {
    try {
      await stakePosition({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_V2_ABI,
        functionName: "stakePosition",
      });
    } catch (error) {
      console.error("Failed to stake position:", error);
    }
  };

  const handleUnstake = async () => {
    try {
      await unstakePosition({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_V2_ABI,
        functionName: "unstakePosition",
      });
    } catch (error) {
      console.error("Failed to unstake position:", error);
    }
  };

  const handleClaimEmissions = async () => {
    try {
      await claimEmissions({
        address: SHADOW_ALM_ADDRESS,
        abi: SHADOW_ALM_V2_ABI,
        functionName: "claimEmissions",
      });
    } catch (error) {
      console.error("Failed to claim emissions:", error);
    }
  };

  const formatEmissions = (value: bigint | undefined) => {
    if (!value) return "0.0000";
    return parseFloat(formatEther(value)).toFixed(4);
  };

  const formatTimeSinceLastClaim = (timestamp: bigint | undefined) => {
    if (!timestamp || timestamp === 0n) return "Never";
    const now = Math.floor(Date.now() / 1000);
    const claimTime = Number(timestamp);
    const diff = now - claimTime;
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="bg-white/5 border border-white/20 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Emissions Management</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-1">Staking Status</p>
          <p className="text-lg font-semibold">
            {isStaked ? (
              <span className="text-green-400">Staked (Earning Emissions)</span>
            ) : (
              <span className="text-yellow-400">Not Staked (Earning Fees)</span>
            )}
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-1">Last Claim</p>
          <p className="text-lg font-semibold text-white">
            {formatTimeSinceLastClaim(lastClaim)}
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-1">Total Emissions Earned</p>
          <p className="text-lg font-semibold font-mono text-white">
            {formatEmissions(totalEmissions)} SHADOW
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-1">Pending Emissions</p>
          <p className="text-lg font-semibold font-mono text-green-400">
            {formatEmissions(pendingEmissions)} SHADOW
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {isStaked ? (
          <>
            <button
              onClick={handleClaimEmissions}
              disabled={isProcessing || !pendingEmissions || pendingEmissions === 0n}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isClaiming ? "Claiming..." : "Claim Emissions"}
            </button>
            <button
              onClick={handleUnstake}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isUnstaking ? "Unstaking..." : "Unstake Position"}
            </button>
          </>
        ) : (
          <button
            onClick={handleStake}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isStaking ? "Staking..." : "Stake Position for Emissions"}
          </button>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>
          {isStaked 
            ? "Your position is staked and earning SHADOW emissions. You won't earn trading fees while staked."
            : "Stake your position to earn SHADOW emissions instead of trading fees."}
        </p>
      </div>
    </div>
  );
}