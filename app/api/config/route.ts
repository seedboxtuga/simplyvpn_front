import { type NextRequest, NextResponse } from "next/server"

const BACKEND_SERVER = process.env.NEXT_PUBLIC_BACKEND_URL || "api.simplyvpn.eu"
const API_KEY = process.env.SIMPLYVPN_API_KEY || "b9a10a840f380a7c4674e303e2e5ca73769f328045166ccfec4da247ebc7699d"

export async function POST(req: NextRequest) {
  try {
    const { country, protocol = "wireguard", server = "1", userId } = await req.json()

    // Normalize input
    const normalizedCountry = country.toLowerCase()
    const normalizedProtocol = protocol.toLowerCase()

    console.log("[SimplyVPN] Requesting config from backend:", { normalizedCountry, normalizedProtocol, server, userId })

    const backendResponse = await fetch(`https://${BACKEND_SERVER}/api/generate-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        country: normalizedCountry,
        server,
        protocol: normalizedProtocol,
        userId,
      }),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error("[SimplyVPN] Backend error:", backendResponse.status, errorText)
      return NextResponse.json({ error: "Backend error", details: errorText }, { status: backendResponse.status })
    }

    const backendData = await backendResponse.json()
    console.log("[SimplyVPN] Config generated successfully")

    return NextResponse.json({
      ok: true,
      config: backendData.config,
      country: normalizedCountry,
      protocol: normalizedProtocol,
    })
  } catch (error: any) {
    console.error("[SimplyVPN] API route error:", error)
    return NextResponse.json({ error: "Failed to generate config", details: error.message }, { status: 500 })
  }
}
