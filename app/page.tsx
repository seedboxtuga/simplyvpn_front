"use client"

import { useState } from "react"
import { MiniKit, VerificationLevel, type ISuccessResult } from "@worldcoin/minikit-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryCard } from "@/components/country-card"
import { Shield, Loader2 } from "lucide-react"
import Image from "next/image"

export default function Page() {
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)

  const handleVerify = async () => {
    if (busy) return
    setBusy(true)

    try {
      if (!MiniKit.isInstalled()) {
        return
      }

      const action = process.env.NEXT_PUBLIC_WORLD_ACTION || "vpnlogin"

      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action,
        verification_level: VerificationLevel.Orb,
      })

      if (finalPayload.status === "error") {
        console.error("Verification failed:", finalPayload)
        return
      }

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action,
          signal: undefined,
        }),
      })

      const json = await res.json()
      if (json.status === 200) {
        setVerified(true)
      } else {
        console.error("Verification failed:", json)
      }
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setBusy(false)
    }
  }

  const handleGetConfig = async (country: string): Promise<string> => {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, userId: "verified-user" }),
    })

    const data = await res.json()
    if (data.status === 200) {
      return data.config
    } else {
      throw new Error(data.error || "Failed to get config")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SimplyVPN" width={32} height={32} className="rounded-lg" />
            <h1 className="text-xl font-bold text-primary">SimplyVPN</h1>
          </div>
          <Shield className="w-6 h-6 text-primary" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!verified ? (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-balance">Secure VPN Access</h2>
              <p className="text-muted-foreground text-lg text-pretty max-w-md mx-auto">
                Verify your identity with World ID to access secure VPN configurations
              </p>
            </div>

            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  World ID Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleVerify} disabled={busy} className="w-full h-12 text-base" size="lg">
                  {busy ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify with World ID
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-balance">Verification Complete</h2>
              <p className="text-muted-foreground">Choose a country to get your VPN configuration</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-center">Available Locations</h3>
              <CountryCard country="Finland" flag="🇫🇮" onGetConfig={handleGetConfig} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
