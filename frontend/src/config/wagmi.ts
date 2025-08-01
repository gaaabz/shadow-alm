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

// Contract addresses - UPDATED WITH COMPATIBLE CONTRACT
export const SHADOW_ALM_ADDRESS = '0xc5287E76a345DBeFe6F250512A637dc0c349dCc6' as const // ShadowALMCompatible - FULLY COMPATIBLE
export const SHADOW_POOL_ADDRESS = '0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7' as const // Compatible pool (fee 100)

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}