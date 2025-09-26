"use client"

import { useEffect, useState } from "react"
import { MiniKit, VerificationLevel, type ISuccessResult } from "@worldcoin/minikit-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryCard } from "@/components/country-card"
import { Shield, Loader2, Info } from "lucide-react"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const COUNTRIES: Array<{country: string; flag: string}> = [
  { country: "Finland", flag: "🇫🇮" },
  { country: "Spain", flag: "🇪🇸" },
  { country: "France", flag: "🇫🇷" },
  { country: "Germany", flag: "🇩🇪" },
  { country: "UK", flag: "🇬🇧" },
  { country: "USA", flag: "🇺🇸" },
  { country: "HongKong", flag: "🇭🇰" },
]

export default function Page() {
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)
  const [showProtocolInfo, setShowProtocolInfo] = useState(false)

  // Persist verification across reloads (prevents "success but not advancing")
  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("svpn_verified") === "1") {
      setVerified(true)
    }
  }, [])

  const handleVerify = async () => {
    if (busy) return
    setBusy(true)

    try {
      const action = process.env.NEXT_PUBLIC_WORLD_ACTION || "vpnlogin"

      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action,
        verification_level: VerificationLevel.Orb,
      })

      if ((finalPayload as any)?.status === "error") {
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

      if (res.ok || json?.ok === true || json?.status === 200 || json?.verifyRes?.success === true) {
        setVerified(true)
        if (typeof window !== "undefined") localStorage.setItem("svpn_verified", "1")
      } else {
        console.error("Verification failed:", json)
      }
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setBusy(false)
    }
  }

  const handleGetConfig = async (country: string, protocol: string): Promise<string> => {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, userId: "verified-user", protocol, server: "1" }),
    })
    const data = await res.json()
    if (res.ok && data?.config) return data.config
    throw new Error(data?.error || "Failed to get config")
  }

  const ProtocolInfoSection = () => (
    <div className="max-w-3xl mx-auto">
      <Collapsible open={showProtocolInfo} onOpenChange={setShowProtocolInfo}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="mb-4 bg-transparent">
            <Info className="w-4 h-4 mr-2" />
            Learn About VPN Protocols
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-600">🔹 VMess</h4>
                    <p className="text-sm text-muted-foreground">Original V2Ray protocol, encrypted by default.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600">🔹 VLESS</h4>
                    <p className="text-sm text-muted-foreground">Successor to VMess, faster and lighter.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600">🔹 Trojan</h4>
                    <p className="text-sm text-muted-foreground">
                      Designed to look like normal HTTPS traffic. Uses real TLS certificates.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-orange-600">🔹 Shadowsocks</h4>
                    <p className="text-sm text-muted-foreground">Secure SOCKS5 proxy with encryption.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-600">🔹 WireGuard</h4>
                    <p className="text-sm text-muted-foreground">Modern VPN protocol, fast and secure.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!verified ? (
          <div className="text-center space-y-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="SimplyVPN" width={64} height={64} className="rounded-lg" />
                <h1 className="text-4xl font-bold text-primary">simplyVPN</h1>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground text-lg text-pretty max-w-md mx-auto">
                  Verify your identity with World ID to access secure VPN configurations
                </p>
              </div>
            </div>

            <ProtocolInfoSection />

            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">World ID Verification</CardTitle>
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
              <div className="flex flex-col items-center gap-4">
                <Image src="/logo.png" alt="SimplyVPN" width={64} height={64} className="rounded-lg" />
              </div>
              <h2 className="text-2xl font-bold text-balance">Verification Complete</h2>
              <p className="text-muted-foreground">Choose a country to get your VPN configuration</p>
            </div>

            <ProtocolInfoSection />

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-center">Available Locations</h3>
              {COUNTRIES.map(({ country, flag }) => (
                <CountryCard key={country} country={country} flag={flag} onGetConfig={handleGetConfig} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
