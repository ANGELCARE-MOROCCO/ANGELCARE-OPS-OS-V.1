
import { NextResponse } from "next/server"
import type { EmailOSApiResponse } from "./types"

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, meta } satisfies EmailOSApiResponse<T>)
}

export function fail(error: string, status = 400, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, meta } satisfies EmailOSApiResponse, { status })
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
