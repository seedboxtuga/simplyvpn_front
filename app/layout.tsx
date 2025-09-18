import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import MiniKitProvider from "@/components/minikit-provider"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "SimplyVPN",
  description: "Secure VPN access with World ID verification",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <MiniKitProvider>{children}</MiniKitProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
