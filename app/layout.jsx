import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Crefisa OTP",
  description: "Aplicação para gerenciamento de tokens OTP",
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.className} bg-gradient-to-b from-background to-background/80 text-foreground min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  )
}
