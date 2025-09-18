import { type NextRequest, NextResponse } from "next/server"

const BACKEND_SERVER = "54.77.18.251"

export async function POST(req: NextRequest) {
  try {
    const { country, userId } = await req.json()

    // For now, only Finland is supported
    if (country !== "Finland") {
      return NextResponse.json({
        status: 400,
        error: "Country not supported",
      })
    }

    // Mock config generation - replace with actual backend call
    const mockConfig = `[Interface]
PrivateKey = ${generateMockKey()}
Address = 10.0.0.${Math.floor(Math.random() * 254) + 1}/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${generateMockKey()}
Endpoint = ${BACKEND_SERVER}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`

    return NextResponse.json({
      status: 200,
      config: mockConfig,
      country: "Finland",
    })
  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: "Failed to generate config",
    })
  }
}

function generateMockKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let result = ""
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
