import React, { useState } from 'react'
import { useAccount } from 'wagmi'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

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
  )
}

export default function DepositWithdraw() {
  const { address, isConnected } = useAccount()
  const [tabValue, setTabValue] = useState(0)
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [shares, setShares] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue)
    setError(null)
    setSuccess(null)
  }

  const handleDeposit = async () => {
    if (!address || !amount0 || !amount1) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Mock transaction - replace with actual contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess(`Successfully deposited ${amount0} Token0 and ${amount1} Token1`)
      setAmount0('')
      setAmount1('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address || !shares) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Mock transaction - replace with actual contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess(`Successfully withdrew ${shares} shares`)
      setShares('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-blue-500/20 border border-blue-500/50 text-blue-100 p-4 rounded-lg">
        <p>Connect your wallet to manage liquidity</p>
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-white/20">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange(0)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tabValue === 0
                ? 'border-blue-400 text-blue-200'
                : 'border-transparent text-gray-300 hover:text-white hover:border-white/30'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => handleTabChange(1)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              tabValue === 1
                ? 'border-blue-400 text-blue-200'
                : 'border-transparent text-gray-300 hover:text-white hover:border-white/30'
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
          Deposit tokens to receive ALM shares. The optimal ratio will be calculated automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Token0 Amount
            </label>
            <input
              type="number"
              value={amount0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount0(e.target.value)}
              disabled={loading}
              placeholder="0.0"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-white/5"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Token1 Amount
            </label>
            <input
              type="number"
              value={amount1}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount1(e.target.value)}
              disabled={loading}
              placeholder="0.0"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-white/5"
            />
          </div>

          <div className="col-span-full">
            <button
              onClick={handleDeposit}
              disabled={loading || !amount0 || !amount1}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                'Deposit'
              )}
            </button>
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <p className="text-gray-300 mb-4">
          Withdraw your share of the liquidity. You'll receive both tokens proportionally.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Shares to Withdraw
            </label>
            <input
              type="number"
              value={shares}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShares(e.target.value)}
              disabled={loading}
              placeholder="0.0"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-white/5"
            />
            <p className="mt-1 text-sm text-gray-400">
              Enter the number of ALM shares to withdraw
            </p>
          </div>

          <div>
            <button
              onClick={handleWithdraw}
              disabled={loading || !shares}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                'Withdraw'
              )}
            </button>
          </div>
        </div>
      </TabPanel>
    </div>
  )
}