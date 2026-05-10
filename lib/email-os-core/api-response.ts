import { NextResponse } from "next/server"

export function okJson<T>(data: T, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, ...(extra || {}) })
}

export function errorJson(error: unknown, fallback = "Request failed", status = 500) {
  const payload = serializeError(error, fallback)
  return NextResponse.json({ ok: false, error: payload.message, debug: payload }, { status })
}

export function serializeError(error: unknown, fallback = "Request failed") {
  if (error instanceof Error) {
    return {
      message: error.message || fallback,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }
  }

  if (typeof error === "object" && error !== null) {
    const value = error as Record<string, unknown>
    return {
      message: String(value.message || value.error || fallback),
      code: value.code,
      details: value.details,
      hint: value.hint
    }
  }

  return { message: typeof error === "string" ? error : fallback }
}
