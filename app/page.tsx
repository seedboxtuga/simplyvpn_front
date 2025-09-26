"use client"

import { useEffect, useState } from "react"
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

  // Restore verification state after refresh
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("svpn_verified") === "1") {
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

      if (res.ok || json.ok === true || json.status === 200 || json?.verifyRes?.success === true) {
        setVerified(true)
        if (typeof window !== "undefined") {
          localStorage.setItem("svpn_verified", "1")
        }
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
      body: JSON.stringify({ country, userId: "verified-user", protocol }),
    })

    const data = await res.json()
    if (res.ok && data?.config) {
      return data.config
    } else {
      throw new Error(data.error || "Failed to get config")
    }
  }

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
                              Original V2Ray protocol, encrypted by default. Supports obfuscation and routing rules.
                              Best for general-purpose censorship circumvention.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-600">🔹 VLESS</h4>
                            <p className="text-sm text-muted-foreground">
                              Successor to VMess, faster and lighter. Works well with TLS 1.3. Ideal for speed + stealth
                              in modern censorship environments.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-purple-600">🔹 Trojan</h4>
                            <p className="text-sm text-muted-foreground">
                              Designed to look like normal HTTPS traffic. Uses real TLS certificates.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-600">🔹 Shadowsocks</h4>
                            <p className="text-sm text-muted-foreground">
                              Secure SOCKS5 proxy with encryption. Lightweight and high speed.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-cyan-600">🔹 WireGuard</h4>
                            <p className="text-sm text-muted-foreground">
                              Modern VPN protocol, kernel-level, fast and secure.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-red-600">🔹 Mixed</h4>
                            <p className="text-sm text-muted-foreground">
                              Multi-protocol handler with fallback options.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-600">🔹 HTTP Proxy</h4>
                            <p className="text-sm text-muted-foreground">
                              Simple web proxy, widely compatible. Good for light use like browsing blocked sites.
                            </p>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              <strong>Stealth ranking:</strong> HTTP → Shadowsocks → WireGuard → Mixed → VMess → VLESS →
                              Trojan
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">World ID Verification</CardTitle>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Powered by World ID</span>
                </div>
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
                <Image src="/logo.png" alt="SimplyVPN" width={48} height={48} className="rounded-lg" />
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-balance">Verification Complete</h2>
              <p className="text-muted-foreground">Choose a country to get your VPN configuration</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Image src="/worldcoin-logo.jpg" alt="World ID" width={14} height={14} />
                <span>Verified with World ID</span>
              </div>
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
