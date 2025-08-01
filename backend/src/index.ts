import express from 'express';
import dotenv from 'dotenv';
import { PriceMonitor } from './services/PriceMonitor';
import { RebalanceEngine } from './services/RebalanceEngine';
import { Logger } from './utils/Logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Initialize services
const logger = new Logger();
const priceMonitor = new PriceMonitor();
const rebalanceEngine = new RebalanceEngine(logger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            priceMonitor: priceMonitor.isRunning(),
            rebalanceEngine: rebalanceEngine.isRunning()
        }
    });
});

// Get current position info
app.get('/position', async (req, res) => {
    try {
        const position = await rebalanceEngine.getCurrentPosition();
        res.json(position);
    } catch (error) {
        logger.error('Error getting position:', error);
        res.status(500).json({ error: 'Failed to get position' });
    }
});

// Get pool info
app.get('/pool', async (req, res) => {
    try {
        const poolInfo = await priceMonitor.getPoolInfo();
        res.json(poolInfo);
    } catch (error) {
        logger.error('Error getting pool info:', error);
        res.status(500).json({ error: 'Failed to get pool info' });
    }
});

// Manual rebalance trigger
app.post('/rebalance', async (req, res) => {
    try {
        const result = await rebalanceEngine.rebalance();
        res.json(result);
    } catch (error) {
        logger.error('Error rebalancing:', error);
        res.status(500).json({ error: 'Failed to rebalance' });
    }
});

// Collect fees
app.post('/collect-fees', async (req, res) => {
    try {
        const result = await rebalanceEngine.collectFees();
        res.json(result);
    } catch (error) {
        logger.error('Error collecting fees:', error);
        res.status(500).json({ error: 'Failed to collect fees' });
    }
});

// Start services
async function startServices() {
    try {
        logger.info('Starting Shadow ALM Executor Service...');
        
        await priceMonitor.start();
        await rebalanceEngine.start();
        
        // Setup price monitoring callback
        priceMonitor.onPriceChange((currentTick: number) => {
            rebalanceEngine.checkRebalanceNeeded(currentTick);
        });
        
        logger.info('All services started successfully');
    } catch (error) {
        logger.error('Failed to start services:', error);
        process.exit(1);
    }
}

app.listen(port, () => {
    logger.info(`Shadow ALM Executor listening on port ${port}`);
    startServices();
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    priceMonitor.stop();
    rebalanceEngine.stop();
    process.exit(0);
});