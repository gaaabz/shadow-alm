import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config/wagmi'
import Dashboard from './components/Dashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700">
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                Shadow ALM
              </h1>
              <p className="text-xl text-blue-100">
                Automated Liquidity Manager for Uniswap V3
              </p>
            </header>
            <Dashboard />
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
