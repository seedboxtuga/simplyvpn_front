"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Check } from "lucide-react"

interface CountryCardProps {
  country: string
  flag: string
  onGetConfig: (country: string) => Promise<string>
  disabled?: boolean
}

export function CountryCard({ country, flag, onGetConfig, disabled }: CountryCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [config, setConfig] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleViewConfig = async () => {
    if (config && isRevealed) {
      setIsRevealed(false)
      return
    }

    if (!config) {
      setLoading(true)
      try {
        const configData = await onGetConfig(country)
        setConfig(configData)
      } catch (error) {
        console.error("Failed to get config:", error)
      } finally {
        setLoading(false)
      }
    }

    setIsRevealed(true)
  }

  const handleCopy = async () => {
    if (config) {
      await navigator.clipboard.writeText(config)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
        <Button
          onClick={handleViewConfig}
          disabled={disabled || loading}
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
              View Config
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
