"use client"

export interface MetaMaskProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
  selectedAddress: string | null
}

export const getMetaMaskProvider = (): MetaMaskProvider | null => {
  if (typeof window !== "undefined" && "ethereum" in window) {
    const provider = (window as any).ethereum
    if (provider?.isMetaMask) {
      return provider
    }
  }
  return null
}

export const connectMetaMaskWallet = async (): Promise<string | null> => {
  const provider = getMetaMaskProvider()
  if (!provider) {
    window.open("https://metamask.io/download/", "_blank")
    return null
  }

  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" })
    return accounts[0]
  } catch (error: any) {
    if (
      error?.code === 4001 ||
      error?.message?.includes("User rejected") ||
      error?.message?.includes("rejected the request")
    ) {
      // User cancelled the connection - this is expected behavior, not an error
      return null
    }
    // Only log actual errors
    console.error("Failed to connect to MetaMask wallet:", error)
    return null
  }
}

export const disconnectMetaMaskWallet = async (): Promise<void> => {
  // MetaMask doesn't have a disconnect method, but we can clear the local state
  // The user would need to disconnect from MetaMask extension directly
  console.log("MetaMask disconnection requested - please disconnect from MetaMask extension")
}
