import { NextResponse } from "next/server"
import {
  archiveAmbassadorEntity,
  createAmbassadorEntity,
  getAmbassadorEntity,
  listAmbassadorEntity,
  updateAmbassadorEntity,
} from "./server"

type AnyPayload = Record<string, any>
type EntityKey =
  | "ambassadors"
  | "territories"
  | "missions"
  | "recruitment"
  | "onboarding"
  | "training"
  | "goals"
  | "incentives"
  | "reports"
  | "audit"

function statusFor(payload: AnyPayload = {}) {
  if (payload?.ok === false) return payload.error === "Record not found" ? 404 : 400
  return 200
}

export function ambassadorJson(payload: AnyPayload, init?: ResponseInit) {
  return NextResponse.json(payload, { status: init?.status || statusFor(payload), headers: init?.headers })
}

export async function readBody(request: Request) {
  return request.json().catch(() => ({}))
}

function isEntity(value: string): value is EntityKey {
  return ["ambassadors", "territories", "missions", "recruitment", "onboarding", "training", "goals", "incentives", "reports", "audit"].includes(value)
}

function assertEntity(value: string): EntityKey {
  if (!isEntity(value)) throw new Error(`Unsupported Ambassador entity: ${value}`)
  return value
}

export async function listRoute(entity: string, _request?: Request) {
  try {
    return ambassadorJson(await listAmbassadorEntity(assertEntity(entity)))
  } catch (error) {
    return ambassadorJson({ ok: false, source: "ambassador-api", error: error instanceof Error ? error.message : "List failed" })
  }
}

export async function createRoute(entity: string, request: Request) {
  try {
    return ambassadorJson(await createAmbassadorEntity(assertEntity(entity), await readBody(request)))
  } catch (error) {
    return ambassadorJson({ ok: false, source: "ambassador-api", error: error instanceof Error ? error.message : "Create failed" })
  }
}

export async function getRoute(entity: string, id: string) {
  try {
    return ambassadorJson(await getAmbassadorEntity(assertEntity(entity), id))
  } catch (error) {
    return ambassadorJson({ ok: false, source: "ambassador-api", error: error instanceof Error ? error.message : "Get failed" })
  }
}

export async function patchRoute(entity: string, id: string, request: Request) {
  try {
    return ambassadorJson(await updateAmbassadorEntity(assertEntity(entity), id, await readBody(request)))
  } catch (error) {
    return ambassadorJson({ ok: false, source: "ambassador-api", error: error instanceof Error ? error.message : "Update failed" })
  }
}

export async function archiveRoute(entity: string, id: string) {
  try {
    return ambassadorJson(await archiveAmbassadorEntity(assertEntity(entity), id))
  } catch (error) {
    return ambassadorJson({ ok: false, source: "ambassador-api", error: error instanceof Error ? error.message : "Archive failed" })
  }
}

export async function handleAmbassadorApi(...args: any[]) {
  return ambassadorJson({ ok: true, source: "ambassador-api", args })
}

export default { handleAmbassadorApi }
