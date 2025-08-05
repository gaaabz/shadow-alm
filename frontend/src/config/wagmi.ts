import { http, createConfig } from 'wagmi'
import { sonic } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = 'your-project-id' // Get from WalletConnect Cloud

export const config = createConfig({
  chains: [sonic],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [sonic.id]: http(),
  },
})

// Contract addresses - Read from environment variables
export const SHADOW_ALM_ADDRESS = (import.meta.env.VITE_SHADOW_ALM_ADDRESS || '0x1Ca0c33100FF40e72d171302C1D0d7b952EC86A7') as `0x${string}`
export const SHADOW_POOL_ADDRESS = (import.meta.env.VITE_SHADOW_POOL_ADDRESS || '0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7') as `0x${string}`

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}