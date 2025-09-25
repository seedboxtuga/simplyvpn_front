import { type NextRequest, NextResponse } from "next/server"

const RAW_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "api.simplyvpn.eu"
const API_KEY = process.env.SIMPLYVPN_API_KEY || ""

/** Build a safe backend URL whether env has scheme (https://api…) or not (api…). */
function buildBackendUrl(path: string) {
  const base = RAW_BACKEND.startsWith("http")
    ? RAW_BACKEND.replace(/\/$/, "")
    : `https://${RAW_BACKEND}`
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export async function POST(req: NextRequest) {
  try {
    const { country, protocol = "wireguard", server = "1", userId } = await req.json()

    if (!API_KEY) {
      return NextResponse.json(
        { status: 500, error: "Server misconfigured: SIMPLYVPN_API_KEY missing" },
        { status: 500 }
      )
    }
    if (!country) {
      return NextResponse.json({ status: 400, error: "Missing 'country' in body" }, { status: 400 })
    }

    const normalizedCountry = String(country).toLowerCase()
    const normalizedProtocol = String(protocol).toLowerCase()
    const serverId = String(server)

    console.log("[SimplyVPN] Requesting config:", { normalizedCountry, normalizedProtocol, server: serverId, userId })

    const backendResponse = await fetch(buildBackendUrl("/api/generate-config"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        country: normalizedCountry,
        server: serverId,
        protocol: normalizedProtocol,
        userId,
      }),
      cache: "no-store",
    })

    const text = await backendResponse.text()
    let backendData: any
    try {
      backendData = JSON.parse(text)
    } catch {
      backendData = { raw: text }
    }

    if (!backendResponse.ok) {
      console.error("[SimplyVPN] Backend error", backendResponse.status, backendData)
      return NextResponse.json(
        { status: backendResponse.status, error: "Backend error", details: backendData },
        { status: backendResponse.status }
      )
    }

    if (backendData?.ok && backendData?.config) {
      return NextResponse.json({ status: 200, ok: true, config: backendData.config }, { status: 200 })
    }

    return NextResponse.json(
      { status: 500, error: "Invalid backend response", details: backendData },
      { status: 500 }
    )
  } catch (error: any) {
    console.error("[SimplyVPN] API route error:", error)
    return NextResponse.json(
      { status: 500, error: "Failed to generate config", details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
