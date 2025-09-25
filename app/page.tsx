"use client"

import { useState } from "react"
import { MiniKit, VerificationLevel, type ISuccessResult } from "@worldcoin/minikit-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryCard } from "@/components/country-card"
import { Shield, Loader2, Info } from "lucide-react"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function Page() {
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)
  const [showProtocolInfo, setShowProtocolInfo] = useState(false)

  const handleVerify = async () => {
    if (busy) return
    setBusy(true)

    try {
      // Do NOT early-return if not installed; allow verification flow to proceed.
      // if (!MiniKit.isInstalled()) { return }

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

      // Accept either HTTP 200 or body.ok === true
      if (res.ok || json?.ok === true) {
        setVerified(true)
      } else if (json?.status === 200) {
        // Backward compatibility with older body shape
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

  const handleGetConfig = async (country: string, protocol: string): Promise<string> => {
    console.log("[v0] Getting config for:", { country, protocol })

    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, userId: "verified-user", protocol }),
    })

    const data = await res.json()
    console.log("[v0] Config API response:", data)

    if (data.status === 200 || res.ok) {
      return data.config
    } else {
      throw new Error(data.error || "Failed to get config")
    }
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
                    <p className="text-sm text-muted-foreground">
                      Original V2Ray protocol, encrypted by default. Supports obfuscation and routing rules. Best for
                      general-purpose censorship circumvention.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-600">🔹 VLESS</h4>
                    <p className="text-sm text-muted-foreground">
                      Successor to VMess, faster and lighter. Works well with TLS 1.3. Ideal for speed + stealth in
                      modern censorship environments.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-purple-600">🔹 Trojan</h4>
                    <p className="text-sm text-muted-foreground">
                      Designed to look like normal HTTPS traffic. Uses real TLS certificates. Perfect when you need to
                      be indistinguishable from web browsing.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-orange-600">🔹 Shadowsocks</h4>
                    <p className="text-sm text-muted-foreground">
                      Secure SOCKS5 proxy with encryption. Lightweight and high speed. Great for fast browsing with some
                      censorship resistance.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-cyan-600">🔹 WireGuard</h4>
                    <p className="text-sm text-muted-foreground">
                      Modern VPN protocol, kernel-level, fast and secure. High performance with strong encryption. Best
                      for general VPN use.
                    </p>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Stealth ranking:</strong> Shadowsocks → WireGuard → VMess → VLESS → Trojan
                    </p>
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
                <CountryCard country="Finland" flag="🇫🇮" />
              </div>
            </div>
          )}
        </div>
      </main>
  )
}