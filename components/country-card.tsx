"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Copy, Check, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CountryCardProps {
  country: string
  flag: string
  onGetConfig: (country: string, protocol: string) => Promise<string>
  disabled?: boolean
}

const VPN_PROTOCOLS = [
  { value: "wireguard", label: "WireGuard", description: "Fast & secure" },
  { value: "vmess", label: "VMESS", description: "V2Ray protocol" },
  { value: "vless", label: "VLESS", description: "Lightweight V2Ray" },
  { value: "trojan", label: "Trojan", description: "TLS-based" },
  { value: "shadowsocks", label: "Shadowsocks", description: "SOCKS5 proxy" },
]

export function CountryCard({ country, flag, onGetConfig, disabled }: CountryCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [config, setConfig] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<string>("wireguard")
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

  const handleViewConfig = async () => {
    if (config && isRevealed) {
      setIsRevealed(false)
      return
    }

    if (!config || !selectedProtocol) {
      setLoading(true)
      setFeedback({ type: null, message: "" })

      try {
        console.log("[v0] Requesting config for protocol:", selectedProtocol)
        const configData = await onGetConfig(country, selectedProtocol)
        setConfig(configData)
        setFeedback({ type: "success", message: `${selectedProtocolInfo?.label} config generated successfully!` })
      } catch (error) {
        console.error("[v0] Failed to get config:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to generate config"
        setFeedback({ type: "error", message: errorMessage })
        return
      } finally {
        setLoading(false)
      }
    }

    setIsRevealed(true)
  }

  const handleProtocolChange = (protocol: string) => {
    setSelectedProtocol(protocol)
    setConfig("")
    setIsRevealed(false)
    setFeedback({ type: null, message: "" })
  }

  const handleCopy = async () => {
    if (config) {
      await navigator.clipboard.writeText(config)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const selectedProtocolInfo = VPN_PROTOCOLS.find((p) => p.value === selectedProtocol)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">{flag}</span>
          <CardTitle className="text-xl font-semibold">{country}</CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit mx-auto">
          Available
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">VPN Protocol</label>
          <Select value={selectedProtocol} onValueChange={handleProtocolChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select protocol" />
            </SelectTrigger>
            <SelectContent>
              {VPN_PROTOCOLS.map((protocol) => (
                <SelectItem key={protocol.value} value={protocol.value}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{protocol.label}</div>
                      <div className="text-xs text-muted-foreground">{protocol.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {feedback.type && (
          <Alert className={feedback.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={feedback.type === "success" ? "text-green-800" : "text-red-800"}>
              {feedback.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleViewConfig}
          disabled={disabled || loading || !selectedProtocol}
          className="w-full"
          variant={isRevealed ? "secondary" : "default"}
        >
          {loading ? (
            "Generating..."
          ) : isRevealed ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Config
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              View {selectedProtocolInfo?.label} Config
            </>
          )}
        </Button>

        {config && (
          <div className="space-y-3">
            <div
              className={`p-4 bg-muted rounded-lg font-mono text-sm transition-all duration-300 ${
                isRevealed ? "" : "blur-sm select-none"
              }`}
              style={{ filter: isRevealed ? "none" : "blur(4px)" }}
            >
              <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed">{config}</pre>
            </div>

            {isRevealed && (
              <Button onClick={handleCopy} variant="outline" size="sm" className="w-full bg-transparent">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Config
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
