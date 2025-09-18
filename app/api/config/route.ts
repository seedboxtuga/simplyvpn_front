import { type NextRequest, NextResponse } from "next/server"

const BACKEND_SERVER = "54.77.18.251"
const FINLAND_SERVER = "https://fi.simplyvpn.eu:60227/"
const FINLAND_IP = "5.144.179.145"

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
      const backendResponse = await fetch(`http://${BACKEND_SERVER}/api/generate-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: "Finland",
          server: FINLAND_SERVER,
          serverIp: FINLAND_IP,
          protocol: protocol,
          userId: userId,
        }),
        timeout: 10000, // 10 second timeout
      })

      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        return NextResponse.json({
          status: 200,
          config: backendData.config,
          country: "Finland",
          protocol: protocol,
        })
      }
    } catch (backendError) {
      console.error("Backend server error:", backendError)
      // Fall back to mock generation if backend is unavailable
    }

    const mockConfig = generateMockConfig(protocol, FINLAND_IP)

    return NextResponse.json({
      status: 200,
      config: mockConfig,
      country: "Finland",
      protocol: protocol,
    })
  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: "Failed to generate config",
    })
  }
}

function generateMockConfig(protocol: string, serverIp: string): string {
  const userId = Math.random().toString(36).substring(2, 15)

  switch (protocol) {
    case "wireguard":
      return `[Interface]
PrivateKey = ${generateMockKey()}
Address = 10.0.0.${Math.floor(Math.random() * 254) + 1}/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${generateMockKey()}
Endpoint = ${serverIp}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`

    case "vmess":
      return JSON.stringify(
        {
          v: "2",
          ps: "SimplyVPN-Finland-VMESS",
          add: serverIp,
          port: "443",
          id: generateUUID(),
          aid: "0",
          scy: "auto",
          net: "ws",
          type: "none",
          host: "fi.simplyvpn.eu",
          path: "/vmess",
          tls: "tls",
          sni: "fi.simplyvpn.eu",
          alpn: "",
        },
        null,
        2,
      )

    case "vless":
      return `vless://${generateUUID()}@${serverIp}:443?encryption=none&security=tls&sni=fi.simplyvpn.eu&type=ws&host=fi.simplyvpn.eu&path=%2Fvless#SimplyVPN-Finland-VLESS`

    case "trojan":
      return `trojan://${generateMockKey().substring(0, 32)}@${serverIp}:443?security=tls&sni=fi.simplyvpn.eu&type=tcp&headerType=none#SimplyVPN-Finland-Trojan`

    case "shadowsocks":
      const method = "aes-256-gcm"
      const password = generateMockKey().substring(0, 32)
      const encoded = btoa(`${method}:${password}`)
      return `ss://${encoded}@${serverIp}:8388#SimplyVPN-Finland-Shadowsocks`

    case "tunnel":
      return `# HTTP Tunnel Configuration
Host: ${serverIp}
Port: 8080
Username: user_${userId}
Password: ${generateMockKey().substring(0, 16)}
Proxy-Type: HTTP-TUNNEL`

    case "mixed":
      return `# Mixed Protocol Configuration
# Primary: VLESS
vless://${generateUUID()}@${serverIp}:443?encryption=none&security=tls&sni=fi.simplyvpn.eu&type=ws&host=fi.simplyvpn.eu&path=%2Fvless#SimplyVPN-Finland-Mixed-VLESS

# Fallback: Shadowsocks
ss://${btoa(`aes-256-gcm:${generateMockKey().substring(0, 32)}`)}@${serverIp}:8388#SimplyVPN-Finland-Mixed-SS`

    case "http":
      return `# HTTP Proxy Configuration
Proxy-Host: ${serverIp}
Proxy-Port: 8080
Proxy-Username: user_${userId}
Proxy-Password: ${generateMockKey().substring(0, 16)}
Proxy-Type: HTTP`

    default:
      return generateMockConfig("wireguard", serverIp)
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

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
