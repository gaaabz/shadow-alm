# Shadow ALM - DeFi Automated Liquidity Manager

**A production-ready automated liquidity management system for Uniswap V3 concentrated liquidity on Sonic Labs blockchain.**

## 🚀 Live Application

**Frontend deployed**: [Your Vercel URL]
**Contract deployed**: `0xc5287E76a345DBeFe6F250512A637dc0c349dCc6` (Sonic Labs - Production)

## 📋 Overview

Shadow ALM is a **fully functional DeFi protocol** that enables users to deposit liquidity into Uniswap V3 positions and receive automated rebalancing for optimal capital efficiency. Built specifically for **Sonic Labs** blockchain with complete integration to **USDC/scUSD pool**.

### ✨ Key Features

🔄 **Automated Rebalancing**: Manual trigger system for position optimization  
💰 **Fee Collection**: Automatic trading fee distribution to liquidity providers  
🛡️ **Non-Custodial Security**: Users maintain full control through ERC20 share tokens  
📱 **Production Frontend**: Deployed React app with Web3 wallet integration  
⛽ **Gas Optimized**: Foundry-compiled contracts with minimal gas usage  
🎯 **Real Pool Integration**: Connected to live USDC/scUSD Uniswap V3 pool  

## 🏗️ Architecture

### Smart Contract (`ShadowALMCompatible.sol`)
- **Deployed**: `0xc5287E76a345DBeFe6F250512A637dc0c349dCc6` (Production)  
- **Pool**: `0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7` (USDC/scUSD, fee 100)
- **Factory**: Official Uniswap V3 factory (fully compatible)
- **Position Manager**: `0x743E03cceB4af2efA3CC76838f6E8B50B63F184c`

### Frontend (React + TypeScript)
- **Framework**: React 19 + Vite + Tailwind CSS v4
- **Web3**: Wagmi v2 + Viem for blockchain interaction
- **Deployment**: Vercel with automatic builds
- **Features**: Real-time data, transaction history, position management

### Manual Executor System
- **No Backend Required**: Frontend-only deployment
- **Manual Rebalancing**: Users can trigger rebalance from UI
- **Gas Estimation**: Real-time gas cost calculation
- **Security**: Only authorized executor can rebalance

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js 18+** and **pnpm**
- **MetaMask wallet** with Sonic Labs network added
- **WalletConnect Project ID** ([Get from here](https://cloud.walletconnect.com))

### 1. Clone and Install

```bash
git clone [your-repo-url]
cd shadow-alm/frontend
pnpm install
```

### 2. Environment Configuration

Create `.env.local` in `frontend/` directory:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Development Server

```bash
cd shadow-alm/frontend
pnpm run dev
```

### 4. Production Build

```bash
pnpm run build
pnpm run preview
```

## 🚀 Deployment (Vercel)

### Prerequisites
- GitHub repository with your code
- Vercel account connected to GitHub

### Steps
1. **Import project** in Vercel from GitHub
2. **Set Root Directory** to `frontend`
3. **Add Environment Variable**: `VITE_WALLETCONNECT_PROJECT_ID`
4. **Deploy** (Vercel auto-detects Vite config)

### Build Settings
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Node.js Version**: 18.x

## 📱 How to Use

### 🔌 Connect Wallet
1. Visit the deployed application
2. Click **"Connect Wallet"**
3. Select **MetaMask** or **WalletConnect**
4. Approve Sonic Labs network addition (Chain ID: 146)

### 💰 Deposit Liquidity
1. Navigate to **"Deposit"** tab
2. Enter amounts for **USDC** and **scUSD**
3. **Approve tokens** if first time (2 transactions)
4. Click **"Deposit"** to receive ALM shares
5. View your position in **"Pool Metrics"**

### 📊 Monitor Position
- **Current Tick**: Live price position
- **Token Holdings**: Your USDC/scUSD amounts
- **Price Range**: Active liquidity range
- **Total Liquidity**: Pool's total liquidity in USD

### 🔄 Rebalance Position
1. **Executor Panel** appears only for authorized address
2. Click **"Rebalance Position"** to optimize range
3. Confirm transaction in wallet
4. Position automatically updates to current price

## 🎯 **Core Strategy: Single-Tick Concentrated Liquidity**

### **Strategy Philosophy**
Shadow ALM implements an **aggressive single-tick strategy** designed to maximize fee capture by concentrating 100% of liquidity in the narrowest possible range around the current price.

**Key Principles:**
- ✅ **Always maintain liquidity in exactly the active tick only**
- ✅ **Use minimum tick spacing (1 tick = ~0.01% price range)**
- ✅ **Immediate rebalancing when price moves outside range**
- ✅ **Maximum capital efficiency for fee generation**

### **Profit Maximization Approach**

**1. Fee Capture Optimization:**
```
Fee Rate = Pool Fee × Liquidity Utilization
Single-tick positions capture fees only when price is within range
Higher concentration = Higher fees when active
```

**2. Capital Efficiency:**
```
Traditional LP: Spread across wide range (low utilization)
Single-tick ALM: 100% utilization when price is in range
Result: 10-100x higher fee generation per dollar
```

**3. Rebalancing Strategy:**
- **Frequency**: Immediate rebalancing on price movement
- **Timing**: Optimal execution during low volatility periods  
- **Cost Management**: Gas-efficient Foundry-compiled contracts

### 💸 Withdraw Liquidity  
1. Navigate to **"Withdraw"** tab
2. Enter **share amount** to withdraw
3. Click **"Withdraw"** to receive proportional tokens
4. Confirm transaction in wallet

### 📈 Transaction History
- View all **deposits**, **withdrawals**, and **rebalances**
- Filter by **recent** or **all history**  
- Toggle **"Show all users"** to see protocol activity
- Click transaction hash to view on **Sonicscan**

## 📊 **Profitability Analysis & Success Metrics**

### **Key Performance Indicators (KPIs)**

**1. Fee Generation Metrics:**
- **Fee APR**: Annual percentage return from trading fees
- **Fee per Dollar per Day**: Daily fee generation per USD deposited
- **Utilization Rate**: % of time liquidity is actively earning fees
- **Fee Capture Rate**: % of total pool fees captured by ALM position

**2. Capital Efficiency Metrics:**
```
Capital Efficiency = Fees Earned / Capital Deployed
Target: >20% APR (vs 2-5% for passive LP)

Fee Concentration Ratio = ALM Fee Rate / Wide Range LP Fee Rate  
Target: 5-10x higher fee generation
```

**3. Operational Metrics:**
- **Rebalance Frequency**: Number of rebalances per day
- **Gas Cost Ratio**: Gas costs as % of fees earned (target: <10%)
- **Position Uptime**: % of time position is active and earning
- **Impermanent Loss vs Fee Income**: Net profitability after IL

### **Profitability Drivers**

**✅ Revenue Sources:**
1. **Trading Fees**: 0.01% per swap through our liquidity
2. **MEV Capture**: Being first in tick during price movements
3. **Capital Efficiency**: 100% utilization vs 10-20% for wide ranges
4. **Compound Growth**: Reinvested fees increase position size

**💰 Profitability Formula:**
```
Net Profit = (Fee Income + MEV Capture) - (Gas Costs + Impermanent Loss)

Target Breakdown:
- Fee Income: 15-25% APR
- Gas Costs: -1-3% APR  
- Impermanent Loss: -5-15% APR (depending on volatility)
- Net Target: 10-20% APR positive
```

## ⚠️ **Risk Analysis & Mitigation Strategies**

### **Primary Risks That Eat Into Profits:**

**1. Impermanent Loss (HIGHEST RISK)**
```
Risk: Single-tick positions have 10x higher IL than wide ranges
Impact: Can lose 10-50% during high volatility periods
Mitigation:
  ✅ Focus on stable pairs (USDC/scUSD)
  ✅ Quick rebalancing to minimize exposure time
  ✅ Monitor volatility and pause during extreme events
```

**2. Gas Cost Spirals**
```
Risk: High rebalance frequency during volatility
Impact: Gas costs can exceed fee income (gas > 10% of fees)
Mitigation:
  ✅ Gas-optimized Foundry contracts
  ✅ Batch operations when possible
  ✅ Rebalance only when profitable (gas < expected fees)
  ✅ Use gas price oracles for optimal timing
```

**3. MEV Sandwich Attacks**
```
Risk: Being sandwiched during rebalancing transactions
Impact: Worse execution prices, reduced profitability
Mitigation:
  ✅ Private mempool submission (Flashbots)
  ✅ Slippage protection in contracts
  ✅ MEV-aware rebalancing timing
```

**4. Liquidity Competition**
```
Risk: Other LPs concentrating in same tick
Impact: Diluted fee share, reduced profitability  
Mitigation:
  ✅ First-mover advantage through fast rebalancing
  ✅ Monitor competitive positions
  ✅ Dynamic tick selection based on competition
```

**5. Smart Contract Risks**
```
Risk: Bugs, exploits, or protocol failures
Impact: Total loss of deposited funds
Mitigation:
  ✅ Gradual rollout with small amounts
  ✅ Emergency pause functionality
  ✅ Multi-sig controls for critical functions
  ✅ Bug bounty program (recommended)
```

### **Success Monitoring Dashboard**

**Real-Time Alerts:**
- 🚨 **Gas Cost Alert**: When gas > 5% of recent fee income
- 🚨 **IL Alert**: When IL > 10% of position value
- 🚨 **Competition Alert**: When other LPs enter our tick
- 🚨 **Utilization Alert**: When position inactive > 30 minutes

**Daily Reports:**
- Fee income vs targets
- Gas cost efficiency  
- IL impact analysis
- Competitive position analysis
- Net profitability trends

## 🔧 Technical Implementation

### Smart Contract Architecture

**`ShadowALMCompatible.sol`** - Main ALM contract:
```solidity
// Core functions
function deposit(uint256 amount0, uint256 amount1) external returns (uint256 shares)
function withdraw(uint256 shares) external returns (uint256 amount0, uint256 amount1)  
function rebalance() external onlyExecutor
function collectFees() external onlyExecutor
function getPosition() external view returns (int24, int24, uint128, uint256, uint256)
```

### Frontend Technology Stack

- **React 19** + **TypeScript** for type safety
- **Tailwind CSS v4** for modern styling  
- **Wagmi v2** + **Viem** for Web3 integration
- **@tanstack/react-query** for data fetching
- **Vite** for fast development and building

### Key Components
- **`DepositWithdraw.tsx`**: Token approval and liquidity management
- **`PoolMetrics.tsx`**: Real-time pool and position data
- **`ExecutorPanel.tsx`**: Rebalancing controls (executor only)
- **`TransactionHistory.tsx`**: Complete transaction tracking
- **`WalletConnect.tsx`**: Web3 wallet integration

## 🛡️ Security & Architecture

### Non-Custodial Design
✅ **Users own ALM ERC20 shares** representing pool ownership  
✅ **No private keys stored** - all transactions via user wallets  
✅ **Transparent smart contract** - all code verifiable on Sonicscan  
✅ **Emergency pause** functionality for critical issues  

### Access Control
- **Owner**: Can set executor, pause contract, collect performance fees
- **Executor**: Can trigger rebalance and fee collection only  
- **Users**: Can deposit, withdraw, and view positions anytime

### Risk Management
⚠️ **Impermanent Loss**: Concentrated liquidity amplifies IL risk  
⚠️ **Gas Costs**: Rebalancing requires gas fees  
⚠️ **Smart Contract Risk**: Unaudited code - use at own risk  
⚠️ **Executor Dependency**: Manual rebalancing required for optimization  

## 🔍 Contract Verification

**Sonic Labs Explorer**: https://sonicscan.org/address/0xc5287E76a345DBeFe6F250512A637dc0c349dCc6

- **Compiler**: Foundry (Solidity 0.8.20)
- **Optimization**: Enabled (200 runs)
- **Libraries**: OpenZeppelin v5 contracts
- **Verification**: Source code available on Sonicscan

## 📊 Live Pool Data

- **Pool Address**: `0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7`
- **Tokens**: USDC (6 decimals) / scUSD (6 decimals)  
- **Fee Tier**: 0.01% (100 basis points)
- **Tick Spacing**: 1 (allows precise positioning)
- **Factory**: Official Uniswap V3 factory on Sonic Labs

## 🚀 Deployment History

1. **Initial Development**: Pool fee 95 (incompatible with Position Manager)
2. **Compatibility Fix**: Migrated to pool fee 100 for full Uniswap V3 support
3. **Gas Optimization**: Foundry compilation reduces deployment costs
4. **Frontend Deployment**: Vercel hosting with automatic builds
5. **Production Ready**: Live on Sonic Labs with real USDC/scUSD pool

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone [your-repo-url]
cd shadow-alm

# Install dependencies  
cd frontend && pnpm install

# Run development server
pnpm run dev
```

### Contract Development
```bash
# Compile contracts (Foundry required)
forge build

# Run tests
forge test

# Deploy to Sonic Labs
forge script script/Deploy.s.sol --rpc-url https://rpc.sonic.technology --broadcast
```

## 📄 License

**MIT License** - Open source DeFi protocol

## ⚠️ Disclaimer

**This is experimental DeFi software deployed on Sonic Labs testnet/mainnet. Use at your own risk.**

- 🔍 **Unaudited smart contracts** - no security audit completed
- 💰 **Financial risk** - potential loss of deposited funds  
- ⛽ **Gas costs** - transaction fees required for all operations
- 📈 **Impermanent loss** - concentrated liquidity increases IL risk
- 🔧 **Beta software** - bugs and issues may exist

**Always test with small amounts first and understand the risks before depositing significant funds.**