"use client"

import { useState } from "react"
import { WorldIDWidget } from "@worldcoin/id"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function CountryCard({ country, flag, onGetConfig }: { country: string; flag: string; onGetConfig: (country: string) => void }) {
  return (
    <Card className="p-4 flex justify-between items-center">
      <CardContent className="flex flex-row justify-between items-center w-full">
        <span className="text-lg font-medium">{flag} {country}</span>
        <Button onClick={() => onGetConfig(country)}>Get Config</Button>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify(proof: any) {
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proof),
      })

      const json = await res.json()

      if (res.ok && (json.ok || json.success)) {
        setVerified(true)
      } else {
        console.error("Verification failed:", json)
        setError("Verification failed. Please try again.")
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      setError("Error verifying. Please try again.")
    }
  }

  async function handleGetConfig(country: string) {
    try {
      setLoading(true)
      setError(null)
      setConfig(null)

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, protocol: "vless", server: "1" }),
      })

      const json = await res.json()

      if (res.ok && json.config) {
        setConfig(json.config)
      } else {
        setError("Failed to fetch config: " + (json.error || "Unknown error"))
      }
    } catch (err: any) {
      console.error("Config fetch error:", err)
      setError("Error fetching config")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-center mb-8">SimplyVPN</h1>

      {!verified && (
        <div className="flex justify-center">
          <WorldIDWidget
            actionId={process.env.NEXT_PUBLIC_WORLD_ACTION || ""}
            signal="login"
            enableTelemetry
            onSuccess={handleVerify}
            onError={(error) => {
              console.error("World ID Error:", error)
              setError("World ID verification failed")
            }}
          />
        </div>
      )}

      {verified && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-center">Available Locations</h3>
          <CountryCard country="Finland" flag="🇫🇮" onGetConfig={handleGetConfig} />
          <CountryCard country="Spain" flag="🇪🇸" onGetConfig={handleGetConfig} />
          <CountryCard country="France" flag="🇫🇷" onGetConfig={handleGetConfig} />
          <CountryCard country="Germany" flag="🇩🇪" onGetConfig={handleGetConfig} />
          <CountryCard country="UK" flag="🇬🇧" onGetConfig={handleGetConfig} />
          <CountryCard country="USA" flag="🇺🇸" onGetConfig={handleGetConfig} />
          <CountryCard country="HongKong" flag="🇭🇰" onGetConfig={handleGetConfig} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center mt-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Generating config...</span>
        </div>
      )}

      {config && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-2">Your Config</h4>
          <pre className="whitespace-pre-wrap break-all text-sm">{config}</pre>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 border rounded bg-red-50 text-red-700">
          <h4 className="font-semibold mb-2">Error</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
