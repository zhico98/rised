"use client"

// Phantom wallet connection utilities
export interface PhantomProvider {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
  publicKey: { toString: () => string } | null
}

export const getPhantomProvider = (): PhantomProvider | null => {
  if (typeof window !== "undefined" && "solana" in window) {
    const provider = (window as any).solana
    if (provider?.isPhantom) {
      return provider
    }
  }
  return null
}

export const connectPhantomWallet = async (): Promise<string | null> => {
  const provider = getPhantomProvider()
  if (!provider) {
    window.open("https://phantom.app/", "_blank")
    return null
  }

  try {
    const response = await provider.connect()
    return response.publicKey.toString()
  } catch (error: any) {
    if (error?.message?.includes("User rejected") || error?.message?.includes("rejected the request")) {
      // User cancelled the connection - this is expected behavior, not an error
      return null
    }
    // Only log actual errors
    console.error("Failed to connect to Phantom wallet:", error)
    return null
  }
}

export const disconnectPhantomWallet = async (): Promise<void> => {
  const provider = getPhantomProvider()
  if (provider) {
    try {
      await provider.disconnect()
    } catch (error) {
      console.error("Failed to disconnect from Phantom wallet:", error)
    }
  }
}
