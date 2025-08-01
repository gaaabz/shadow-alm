# Shadow DEX Automated Liquidity Manager (ALM)

An automated liquidity management system for Shadow DEX on the Sonic network that maintains liquidity in the narrowest possible range (single tick) to maximize SHADOW token emissions.

## Overview

The Shadow ALM automatically manages concentrated liquidity positions on Shadow DEX by:
- Keeping liquidity exactly in the active tick only
- Automatically rebalancing when price moves outside the current range
- Maximizing SHADOW token emissions through optimal positioning
- Providing a user-friendly interface for deposits and withdrawals

## Architecture

### Smart Contract (`ShadowALM.sol`)
- **Non-custodial**: Users maintain ownership through share tokens
- **Automated rebalancing**: Triggered by executor service
- **Fee collection**: Automatic collection and distribution of trading fees
- **Emergency controls**: Pause functionality and access controls

### TypeScript Executor Service
- **Price monitoring**: Continuous monitoring of pool tick changes
- **Rebalance triggers**: Automatic position adjustments
- **Gas optimization**: Efficient transaction execution
- **REST API**: Interface for frontend and monitoring

### React Frontend
- **Wallet integration**: MetaMask connection with Sonic network support
- **Position management**: Deposit/withdraw interface
- **Real-time metrics**: Pool and position monitoring
- **Transaction history**: Complete transaction tracking

## Target Pool

- **Address**: `0x2c13383855377faf5a562f1aef47e4be7a0f12ac`
- **Network**: Sonic (Chain ID: 146)
- **Strategy**: Single-tick concentrated liquidity

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- Sonic network RPC access

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
PRIVATE_KEY=your_private_key_here
SONICSCAN_API_KEY=your_sonicscan_api_key_here
RPC_URL=https://rpc.soniclabs.com
SHADOW_POOL_ADDRESS=0x2c13383855377faf5a562f1aef47e4be7a0f12ac
ALM_CONTRACT_ADDRESS=your_deployed_alm_address
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Deploy Contracts

```bash
# Deploy to Sonic network
npx hardhat run scripts/deploy.ts --network sonic
```

### 5. Start Services

```bash
# Start backend executor service
npm run backend

# Start frontend (in separate terminal)
npm run frontend

# Or start both concurrently
npm run dev
```

## Usage

### For Liquidity Providers

1. **Connect Wallet**: Connect MetaMask to Sonic network
2. **Deposit Liquidity**: Provide Token0 and Token1 to receive ALM shares
3. **Monitor Position**: View real-time position and performance metrics
4. **Withdraw**: Burn ALM shares to receive proportional liquidity back

### For Operators

1. **Monitor Service**: Check executor service health at `/health`
2. **Manual Rebalance**: Force rebalance via `/rebalance` endpoint
3. **Collect Fees**: Trigger fee collection via `/collect-fees` endpoint

## API Endpoints

### Executor Service (Port 3001)

- `GET /health` - Service health check
- `GET /position` - Current position information
- `GET /pool` - Pool metrics and data
- `POST /rebalance` - Manual rebalance trigger
- `POST /collect-fees` - Collect trading fees

## Smart Contract Functions

### User Functions
- `deposit(uint256 amount0, uint256 amount1)` - Deposit liquidity
- `withdraw(uint256 shares)` - Withdraw liquidity
- `getPosition()` - View current position

### Executor Functions
- `rebalance()` - Rebalance to current tick
- `collectFees()` - Collect and distribute fees

### Admin Functions
- `setExecutor(address)` - Update executor address
- `setPerformanceFee(uint256)` - Update performance fee
- `pause() / unpause()` - Emergency controls

## Configuration

### Rebalancing Parameters
- **Minimum Interval**: 60 seconds between rebalances
- **Tick Range**: Single tick spacing (narrowest possible)
- **Gas Buffer**: 50,000 gas units added to estimates

### Performance Fees
- **Default**: 10% of collected trading fees
- **Maximum**: 20% (hardcoded limit)
- **Distribution**: Sent to contract owner

## Security Features

- **Non-custodial design**: Users maintain token ownership
- **Access controls**: Executor and admin roles
- **Emergency pause**: Stop operations if needed
- **Gas estimation**: Prevent failed transactions
- **Input validation**: Comprehensive parameter checking

## Monitoring & Alerts

The executor service provides comprehensive logging and monitoring:

- **Price changes**: Logged when tick changes detected
- **Rebalance events**: Complete transaction details
- **Error handling**: Detailed error logging and recovery
- **Health checks**: Service status and connectivity

## Deployment Guide

### 1. Sonic Network Setup
- Add Sonic network to MetaMask
- Fund deployer account with S tokens
- Verify RPC connectivity

### 2. Contract Deployment
- Update hardhat.config.ts with correct parameters
- Deploy ShadowALM contract
- Verify on Sonicscan (optional)

### 3. Service Configuration
- Update environment variables
- Start executor service
- Verify pool monitoring

### 4. Frontend Deployment
- Build React application
- Deploy to hosting platform
- Configure API endpoints

## Risk Considerations

- **Impermanent Loss**: Single-tick positions have higher IL risk
- **Gas Costs**: Frequent rebalancing incurs gas fees
- **Smart Contract Risk**: Audit recommended before mainnet
- **Executor Risk**: Service availability critical for rebalancing

## Development

### Testing
```bash
# Run contract tests
npx hardhat test

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

### Local Development
```bash
# Start local hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

## Support

For issues and questions:
- Check the logs in `backend/logs/`
- Verify network connectivity
- Ensure correct environment variables
- Monitor transaction status on Sonicscan

## License

MIT License - See LICENSE file for details.

---

**Disclaimer**: This is experimental software. Use at your own risk. Automated liquidity management involves financial risk and smart contract risk. Consider auditing before production use.