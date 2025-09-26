import { type NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "@worldcoin/minikit-js"

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload

    // Accept both server-only and public env vars for WORLD_APP_ID
    const app_id =
      (process.env.WORLD_APP_ID as `app_${string}` | undefined) ||
      (process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}` | undefined)

    if (!app_id) {
      return NextResponse.json(
        { ok: false, status: 500, error: "Missing WORLD_APP_ID" },
        { status: 500 }
      )
    }

    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal ?? undefined
    )) as IVerifyResponse

    if (verifyRes.success) {
      return NextResponse.json(
        { ok: true, status: 200, verifyRes },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { ok: false, status: 400, verifyRes },
        { status: 400 }
      )
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, status: 500, error: err?.message || "Server error" },
      { status: 500 }
    )
  }
}
