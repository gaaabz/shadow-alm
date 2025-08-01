import { ethers } from 'ethers';
import { Logger } from '../utils/Logger';

export interface Position {
    tickLower: number;
    tickUpper: number;
    liquidity: string;
    amount0: string;
    amount1: string;
}

export interface RebalanceResult {
    success: boolean;
    txHash?: string;
    gasUsed?: string;
    error?: string;
}

export class RebalanceEngine {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private almContract: ethers.Contract;
    private logger: Logger;
    private running: boolean = false;
    private isRebalancing: boolean = false;
    private lastRebalanceTime: number = 0;
    private readonly MIN_REBALANCE_INTERVAL = 60000; // 1 minute

    private readonly ALM_ABI = [
        'function rebalance() external',
        'function collectFees() external',
        'function getPosition() external view returns (int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 amount0, uint256 amount1)',
        'function currentTickLower() external view returns (int24)',
        'function currentTickUpper() external view returns (int24)'
    ];

    constructor(logger: Logger) {
        this.logger = logger;
        
        const rpcUrl = process.env.RPC_URL || 'https://rpc.soniclabs.com';
        const privateKey = process.env.PRIVATE_KEY;
        const almAddress = process.env.ALM_CONTRACT_ADDRESS;
        
        if (!privateKey) {
            throw new Error('PRIVATE_KEY environment variable is required');
        }
        
        if (!almAddress) {
            throw new Error('ALM_CONTRACT_ADDRESS environment variable is required');
        }
        
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.almContract = new ethers.Contract(almAddress, this.ALM_ABI, this.wallet);
    }

    async start(): Promise<void> {
        if (this.running) return;
        
        this.logger.info('Starting rebalance engine...');
        this.running = true;
        
        // Check initial balance
        const balance = await this.provider.getBalance(this.wallet.address);
        this.logger.info(`Executor wallet balance: ${ethers.formatEther(balance)} ETH`);
        
        this.logger.info('Rebalance engine started');
    }

    stop(): void {
        if (!this.running) return;
        
        this.logger.info('Stopping rebalance engine...');
        this.running = false;
        this.logger.info('Rebalance engine stopped');
    }

    isRunning(): boolean {
        return this.running;
    }

    async checkRebalanceNeeded(currentTick: number): Promise<void> {
        if (!this.running || this.isRebalancing) return;
        
        try {
            const position = await this.getCurrentPosition();
            
            // Check if current tick is outside position range
            const needsRebalance = currentTick < position.tickLower || currentTick >= position.tickUpper;
            
            if (needsRebalance) {
                // Check minimum interval
                const now = Date.now();
                if (now - this.lastRebalanceTime < this.MIN_REBALANCE_INTERVAL) {
                    this.logger.info('Rebalance needed but waiting for minimum interval');
                    return;
                }
                
                this.logger.info(`Rebalance needed: tick ${currentTick} outside range [${position.tickLower}, ${position.tickUpper})`);
                await this.rebalance();
            }
        } catch (error) {
            this.logger.error('Error checking rebalance need:', error);
        }
    }

    async rebalance(): Promise<RebalanceResult> {
        if (this.isRebalancing) {
            return { success: false, error: 'Rebalance already in progress' };
        }
        
        this.isRebalancing = true;
        this.logger.info('Starting rebalance...');
        
        try {
            // Check gas price and balance
            const gasPrice = await this.provider.getFeeData();
            const balance = await this.provider.getBalance(this.wallet.address);
            
            this.logger.info(`Gas price: ${gasPrice.gasPrice} wei`);
            this.logger.info(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
            
            // Estimate gas
            const gasEstimate = await this.almContract.rebalance.estimateGas();
            const totalGasCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));
            
            if (balance < totalGasCost) {
                throw new Error('Insufficient balance for gas');
            }
            
            // Execute rebalance
            const tx = await this.almContract.rebalance({
                gasLimit: gasEstimate + BigInt(50000), // Add buffer
                gasPrice: gasPrice.gasPrice
            });
            
            this.logger.info(`Rebalance transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            this.lastRebalanceTime = Date.now();
            
            this.logger.info(`Rebalance completed. Gas used: ${receipt.gasUsed}`);
            
            return {
                success: true,
                txHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            this.logger.error('Rebalance failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        } finally {
            this.isRebalancing = false;
        }
    }

    async collectFees(): Promise<RebalanceResult> {
        this.logger.info('Collecting fees...');
        
        try {
            const tx = await this.almContract.collectFees();
            this.logger.info(`Collect fees transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            this.logger.info(`Fees collected. Gas used: ${receipt.gasUsed}`);
            
            return {
                success: true,
                txHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            this.logger.error('Collect fees failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async getCurrentPosition(): Promise<Position> {
        const position = await this.almContract.getPosition();
        
        return {
            tickLower: Number(position.tickLower),
            tickUpper: Number(position.tickUpper),
            liquidity: position.liquidity.toString(),
            amount0: position.amount0.toString(),
            amount1: position.amount1.toString()
        };
    }
}