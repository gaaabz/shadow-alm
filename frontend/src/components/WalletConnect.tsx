import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Connect Wallet</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
          >
            {isPending ? 'Connecting...' : connector.name}
          </button>
        ))}
      </div>
    </div>
  )
}