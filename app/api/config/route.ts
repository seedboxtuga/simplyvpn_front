import { type NextRequest, NextResponse } from "next/server"

const BACKEND_SERVER = process.env.NEXT_PUBLIC_BACKEND_URL || "api.simplyvpn.eu"
const FINLAND_SERVER = "https://fi.simplyvpn.eu:60227/"
const FINLAND_IP = "5.144.179.145"
const API_KEY = process.env.SIMPLYVPN_API_KEY || "simplyvpn-default-key-2024"

export async function POST(req: NextRequest) {
  try {
    const { country, userId, protocol = "wireguard" } = await req.json()

    // For now, only Finland is supported
    if (country !== "Finland") {
      return NextResponse.json({
        status: 400,
        error: "Country not supported",
      })
    }

    try {
      console.log("[v0] Requesting config from backend:", { country, protocol, userId })

      const backendResponse = await fetch(`https://${BACKEND_SERVER}/api/generate-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          country: "finland", // Changed to lowercase to match backend expectation
          server: FINLAND_SERVER,
          serverIp: FINLAND_IP,
          protocol: protocol,
          userId: userId,
          createNewInbound: true,
        }),
      })

      console.log("[v0] Backend response status:", backendResponse.status)

      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        console.log("[v0] Backend config generated successfully")

        return NextResponse.json({
          status: 200,
          config: backendData.config,
          country: "Finland",
          protocol: protocol,
          inboundId: backendData.inboundId,
          port: backendData.port,
        })
      } else {
        const errorText = await backendResponse.text()
        console.log("[v0] Backend error response:", errorText)

        return NextResponse.json({
          status: 500,
          error: `Backend server error: ${backendResponse.status}`,
        })
      }
    } catch (backendError) {
      console.error("[v0] Backend server connection failed:", backendError)

      return NextResponse.json({
        status: 503,
        error: "Backend server unavailable. Please try again later.",
      })
    }
  } catch (error) {
    console.error("[v0] API route error:", error)

    return NextResponse.json({
      status: 500,
      error: "Failed to generate config",
    })
  }
}
