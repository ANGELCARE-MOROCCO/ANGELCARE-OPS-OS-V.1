import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const action = body?.action
    const requirementId = body?.requirement_id

    if (!action || !requirementId) {
      return NextResponse.json({ ok: false, error: "Missing action or requirement_id." }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      action,
      requirement_id: requirementId,
      payload: body?.payload || null,
      message: "Content-campaign sync action accepted.",
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Sync action failed." }, { status: 500 })
  }
}
