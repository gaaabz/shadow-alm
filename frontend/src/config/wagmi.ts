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

// Contract addresses - V2 with AccessControl and Emissions
export const SHADOW_ALM_ADDRESS = '0xe7cb31770E000cfF84fBe656f168bA0040eAdF40' as const // ShadowALMV2 - With AccessControl & Emissions
export const SHADOW_POOL_ADDRESS = '0xDFCDAD314b0b96AB8890391e3F0540278E3B80F7' as const // Compatible pool (fee 100)

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}