import { ethers } from 'ethers';

// Import contract ABI (you'll need to export this from your compiled contracts)
const ALM_ABI = [
  "function rebalance() external",
  "function collectFees() external",
  "function claimEmissions() external",
  "function isStaked() external view returns (bool)",
  "function currentPositionId() external view returns (uint256)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function EXECUTOR_ROLE() external view returns (bytes32)"
];

export default async function handler(req, res) {
  // Verify this is a Vercel Cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.soniclabs.com');
    const signer = new ethers.Wallet(process.env.EXECUTOR_PRIVATE_KEY, provider);
    
    // Contract instance
    const almContract = new ethers.Contract(
      process.env.ALM_CONTRACT_ADDRESS,
      ALM_ABI,
      signer
    );

    // Check if signer has executor role
    const executorRole = await almContract.EXECUTOR_ROLE();
    const hasRole = await almContract.hasRole(executorRole, signer.address);
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Signer does not have executor role' });
    }

    const results = {
      timestamp: new Date().toISOString(),
      executed: []
    };

    // 1. Try to rebalance
    try {
      const tx = await almContract.rebalance();
      await tx.wait();
      results.executed.push({
        action: 'rebalance',
        txHash: tx.hash,
        status: 'success'
      });
    } catch (error) {
      results.executed.push({
        action: 'rebalance',
        error: error.message,
        status: 'failed'
      });
    }

    // 2. Check if staked to determine whether to collect fees or emissions
    const isStaked = await almContract.isStaked();
    
    if (isStaked) {
      // Claim emissions if staked
      try {
        const tx = await almContract.claimEmissions();
        await tx.wait();
        results.executed.push({
          action: 'claimEmissions',
          txHash: tx.hash,
          status: 'success'
        });
      } catch (error) {
        results.executed.push({
          action: 'claimEmissions',
          error: error.message,
          status: 'failed'
        });
      }
    } else {
      // Collect fees if not staked
      try {
        const positionId = await almContract.currentPositionId();
        if (positionId > 0) {
          const tx = await almContract.collectFees();
          await tx.wait();
          results.executed.push({
            action: 'collectFees',
            txHash: tx.hash,
            status: 'success'
          });
        }
      } catch (error) {
        results.executed.push({
          action: 'collectFees',
          error: error.message,
          status: 'failed'
        });
      }
    }

    // Log results
    console.log('Executor results:', JSON.stringify(results, null, 2));

    return res.status(200).json(results);
  } catch (error) {
    console.error('Executor error:', error);
    return res.status(500).json({ 
      error: 'Executor failed',
      message: error.message 
    });
  }
}