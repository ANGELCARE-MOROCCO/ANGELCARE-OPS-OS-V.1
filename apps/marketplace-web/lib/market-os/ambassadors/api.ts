import { NextResponse } from "next/server"
import { resolveAmbassadorActor } from "./auth"
import type { AmbassadorActor, AmbassadorEntityKey, AmbassadorServiceResult } from "./contracts"
import { AMBASSADOR_ENTITIES } from "./contracts"
import { asAmbassadorServiceError } from "./errors"
import {
  archiveAmbassadorEntity,
  createAmbassadorEntity,
  getAmbassadorEntity,
  listAmbassadorEntity,
  updateAmbassadorEntity,
} from "./server"

type AnyPayload = Record<string, unknown>

const STATUS_BY_CODE: Record<string, number> = {
  AUTH_REQUIRED: 401,
  AUTH_INVALID: 401,
  FORBIDDEN: 403,
  SCOPE_REQUIRED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GATE_BLOCKED: 409,
  VALIDATION_ERROR: 400,
  CONFIGURATION_ERROR: 503,
  PERSISTENCE_ERROR: 503,
}

function statusFor(payload: AnyPayload = {}): number {
  if (typeof payload.status === "number") return payload.status
  const code = String(payload.code || "")
  if (STATUS_BY_CODE[code]) return STATUS_BY_CODE[code]
  if (payload.ok === false) return payload.error === "Record not found" ? 404 : 400
  return 200
}

export function ambassadorJson(payload: AnyPayload, init?: ResponseInit) {
  return NextResponse.json(payload, {
    status: init?.status || statusFor(payload),
    headers: {
      "Cache-Control": "no-store, private",
      ...(init?.headers || {}),
    },
  })
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => ({})) as Promise<Record<string, unknown>>
}

export function assertEntity(value: string): AmbassadorEntityKey {
  if (!AMBASSADOR_ENTITIES.includes(value as AmbassadorEntityKey)) throw new Error(`Unsupported Ambassador entity: ${value}`)
  return value as AmbassadorEntityKey
}

export async function withAmbassadorActor(
  request: Request,
  handler: (actor: AmbassadorActor) => Promise<AmbassadorServiceResult<unknown> | AnyPayload | Response>,
): Promise<Response> {
  try {
    const actor = await resolveAmbassadorActor(request)
    const result = await handler(actor)
    if (result instanceof Response) return result
    return ambassadorJson(result as AnyPayload)
  } catch (error) {
    const resolved = asAmbassadorServiceError(error)
    const source = ["AUTH_REQUIRED", "AUTH_INVALID", "FORBIDDEN", "SCOPE_REQUIRED"].includes(resolved.code)
      ? "ambassador-auth"
      : resolved.code === "VALIDATION_ERROR" || resolved.code === "CONFLICT" || resolved.code === "GATE_BLOCKED"
        ? "ambassador-validation"
        : "ambassador-supabase"
    return ambassadorJson({ ok: false, source, error: resolved.message, code: resolved.code, status: resolved.status })
  }
}

export async function listRoute(entity: string, request: Request) {
  return withAmbassadorActor(request, (actor) => listAmbassadorEntity(actor, assertEntity(entity)))
}

export async function createRoute(entity: string, request: Request) {
  return withAmbassadorActor(request, async (actor) => createAmbassadorEntity(actor, assertEntity(entity), await readBody(request)))
}

export async function getRoute(entity: string, id: string, request: Request) {
  return withAmbassadorActor(request, (actor) => getAmbassadorEntity(actor, assertEntity(entity), id))
}

export async function patchRoute(entity: string, id: string, request: Request) {
  return withAmbassadorActor(request, async (actor) => updateAmbassadorEntity(actor, assertEntity(entity), id, await readBody(request)))
}

export async function archiveRoute(entity: string, id: string, request: Request) {
  return withAmbassadorActor(request, (actor) => archiveAmbassadorEntity(actor, assertEntity(entity), id))
}
