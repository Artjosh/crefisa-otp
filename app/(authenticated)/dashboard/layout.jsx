import { Inter } from "next/font/google"
import "../../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CapacitorProvider } from "@/components/capacitor-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "OTP Manager",
  description: "Manage your two-factor authentication codes",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <CapacitorProvider>{children}</CapacitorProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
