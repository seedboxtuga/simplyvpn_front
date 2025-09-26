import { type NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"

type RequestBody = {
  payload: ISuccessResult
  action: string
  signal?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as RequestBody

    // Accept either server-only or (if misconfigured) public env var for app id
    const app_id =
      (process.env.WORLD_APP_ID as `app_${string}` | undefined) ||
      (process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}` | undefined)

    if (!app_id) {
      return NextResponse.json({ ok: false, error: "Missing WORLD_APP_ID" }, { status: 500 })
    }

    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal ?? undefined
    )) as IVerifyResponse

    if (verifyRes.success) {
      return NextResponse.json({ ok: true, verifyRes }, { status: 200 })
    } else {
      return NextResponse.json({ ok: false, verifyRes }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    )
  }
}
