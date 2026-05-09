import { NextResponse } from "next/server"

export function finalOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, meta })
}

export function finalFail(error: string, status = 400, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, meta }, { status })
}

export async function finalJson<T = any>(request: Request): Promise<T | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
