import { ethers } from 'ethers';
import { Logger } from '../utils/Logger';

export interface PoolInfo {
    currentTick: number;
    sqrtPriceX96: string;
    liquidity: string;
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
}

export class PriceMonitor {
    private provider: ethers.JsonRpcProvider;
    private poolContract: ethers.Contract;
    private logger: Logger;
    private running: boolean = false;
    private intervalId?: NodeJS.Timeout;
    private priceChangeCallback?: (currentTick: number) => void;
    private lastTick?: number;

    private readonly POOL_ABI = [
        'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
        'function token0() view returns (address)',
        'function token1() view returns (address)',
        'function fee() view returns (uint24)',
        'function tickSpacing() view returns (int24)',
        'function liquidity() view returns (uint128)'
    ];

    constructor() {
        this.logger = new Logger();
        const rpcUrl = process.env.RPC_URL || 'https://rpc.soniclabs.com';
        const poolAddress = process.env.SHADOW_POOL_ADDRESS || '0x2c13383855377faf5a562f1aef47e4be7a0f12ac';
        
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.poolContract = new ethers.Contract(poolAddress, this.POOL_ABI, this.provider);
    }

    async start(): Promise<void> {
        if (this.running) return;
        
        this.logger.info('Starting price monitor...');
        this.running = true;
        
        // Initial price check
        await this.checkPrice();
        
        // Setup polling interval (every 5 seconds)
        this.intervalId = setInterval(() => {
            this.checkPrice().catch(error => {
                this.logger.error('Error checking price:', error);
            });
        }, 5000);
        
        this.logger.info('Price monitor started');
    }

    stop(): void {
        if (!this.running) return;
        
        this.logger.info('Stopping price monitor...');
        this.running = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        
        this.logger.info('Price monitor stopped');
    }

    isRunning(): boolean {
        return this.running;
    }

    onPriceChange(callback: (currentTick: number) => void): void {
        this.priceChangeCallback = callback;
    }

    private async checkPrice(): Promise<void> {
        try {
            const slot0 = await this.poolContract.slot0();
            const currentTick = Number(slot0.tick);
            
            // Check if tick has changed
            if (this.lastTick !== undefined && this.lastTick !== currentTick) {
                this.logger.info(`Tick changed: ${this.lastTick} -> ${currentTick}`);
                
                if (this.priceChangeCallback) {
                    this.priceChangeCallback(currentTick);
                }
            }
            
            this.lastTick = currentTick;
        } catch (error) {
            this.logger.error('Error checking price:', error);
        }
    }

    async getPoolInfo(): Promise<PoolInfo> {
        const [slot0, token0, token1, fee, tickSpacing, liquidity] = await Promise.all([
            this.poolContract.slot0(),
            this.poolContract.token0(),
            this.poolContract.token1(),
            this.poolContract.fee(),
            this.poolContract.tickSpacing(),
            this.poolContract.liquidity()
        ]);

        return {
            currentTick: Number(slot0.tick),
            sqrtPriceX96: slot0.sqrtPriceX96.toString(),
            liquidity: liquidity.toString(),
            token0,
            token1,
            fee: Number(fee),
            tickSpacing: Number(tickSpacing)
        };
    }

    getCurrentTick(): number | undefined {
        return this.lastTick;
    }
}