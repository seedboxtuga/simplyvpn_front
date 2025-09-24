import { type NextRequest, NextResponse } from "next/server"

const BACKEND_SERVER = process.env.NEXT_PUBLIC_BACKEND_URL || "api.simplyvpn.eu"
const API_KEY = process.env.SIMPLYVPN_API_KEY || "b9a10a840f380a7c4674e303e2e5ca73769f328045166ccfec4da247ebc7699d"

export async function POST(req: NextRequest) {
  try {
    const { country, protocol = "wireguard", server = "server1", userId } = await req.json()

    // Normalize input
    const normalizedCountry = country.toLowerCase()
    const normalizedProtocol = protocol.toLowerCase()

    console.log("[v0] Requesting config from backend:", { normalizedCountry, normalizedProtocol, server, userId })

    const backendResponse = await fetch(`https://${BACKEND_SERVER}/api/generate-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        country: normalizedCountry,
        server,
        protocol: normalizedProtocol,
        userId,
      }),
    })

    console.log("[v0] Backend response status:", backendResponse.status)

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error("[v0] Backend error:", backendResponse.status, errorText)
      return NextResponse.json(
        {
          status: backendResponse.status,
          error: "Backend error",
          details: errorText,
        },
        { status: backendResponse.status },
      )
    }

    const backendData = await backendResponse.json()
    console.log("[v0] Backend response data:", backendData)

    if (backendData.ok && backendData.config) {
      console.log("[v0] Config generated successfully")
      return NextResponse.json({
        status: 200,
        config: backendData.config,
        country: normalizedCountry,
        protocol: normalizedProtocol,
      })
    } else {
      console.error("[v0] Backend returned invalid response:", backendData)
      return NextResponse.json(
        {
          status: 500,
          error: "Invalid backend response",
          details: backendData,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] API route error:", error)
    return NextResponse.json(
      {
        status: 500,
        error: "Failed to generate config",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
