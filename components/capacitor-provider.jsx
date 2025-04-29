"use client"

import { createContext, useContext, useEffect, useState } from "react"

const CapacitorContext = createContext({
  isNative: false,
  platform: null,
})

export function CapacitorProvider({ children }) {
  const [state, setState] = useState({
    isNative: false,
    platform: null,
  })

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        // Dynamically import Capacitor only on the client side
        const { Capacitor } = await import("@capacitor/core")

        if (Capacitor.isNativePlatform()) {
          const platform = Capacitor.getPlatform()
          setState({
            isNative: true,
            platform,
          })

          // Import and initialize SplashScreen if in native environment
          try {
            const { SplashScreen } = await import("@capacitor/splash-screen")
            await SplashScreen.hide()
          } catch (error) {
            console.error("Error initializing SplashScreen:", error)
          }
        }
      } catch (error) {
        console.error("Capacitor not available:", error)
      }
    }

    initCapacitor()
  }, [])

  return <CapacitorContext.Provider value={state}>{children}</CapacitorContext.Provider>
}

export const useCapacitor = () => {
  const context = useContext(CapacitorContext)

  if (context === undefined) {
    throw new Error("useCapacitor must be used within a CapacitorProvider")
  }

  return context
}
