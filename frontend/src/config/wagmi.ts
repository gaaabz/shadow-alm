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

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}