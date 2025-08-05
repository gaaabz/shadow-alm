import { useAccount } from 'wagmi'
import WalletConnect from './WalletConnect'
import PoolMetrics from './PoolMetrics'
import PositionInfo from './PositionInfo'
import DepositWithdraw from './DepositWithdraw'
import TransactionHistory from './TransactionHistory'
import ExecutorPanel from './ExecutorPanel'
import EmissionsPanel from './EmissionsPanel'

export default function Dashboard() {
  const { isConnected } = useAccount()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <WalletConnect />
      </div>

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Pool Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Pool Metrics</h2>
              <PoolMetrics />
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Transaction History</h2>
              <TransactionHistory />
            </div>

            <ExecutorPanel />
            
            <EmissionsPanel />
          </div>

          {/* Right Column - Position & Actions */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Your Position</h2>
              <PositionInfo />
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Manage Liquidity</h2>
              <DepositWithdraw />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-blue-100">
              Connect your wallet to start using the Shadow ALM
            </p>
          </div>
        </div>
      )}
    </div>
  )
}