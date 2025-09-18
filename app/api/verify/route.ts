import { type NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal: string | undefined
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload
    const app_id = process.env.WORLD_APP_ID as `app_${string}` | undefined
    if (!app_id) {
      return NextResponse.json({ status: 500, error: "Missing WORLD_APP_ID" })
    }
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse
    if (verifyRes.success) {
      return NextResponse.json({ status: 200, verifyRes })
    } else {
      return NextResponse.json({ status: 400, verifyRes })
    }
  } catch {
    return NextResponse.json({ status: 500, error: "Server error" })
  }
}
