import { NextResponse } from "next/server"
import type { AmbassadorEntity, ApiResponse } from "./types"
import {
  archiveAmbassadorEntity,
  createAmbassadorEntity,
  getAmbassadorEntity,
  listAmbassadorEntity,
  updateAmbassadorEntity,
} from "./server"

export function ambassadorJson<T>(payload: ApiResponse<T>, status = payload.ok ? 200 : 400) {
  return NextResponse.json(payload, { status })
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => ({}))
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

export async function listRoute(entity: AmbassadorEntity, request: Request) {
  const params = new URL(request.url).searchParams
  return ambassadorJson(await listAmbassadorEntity(entity, params))
}

export async function createRoute(entity: AmbassadorEntity, request: Request) {
  return ambassadorJson(await createAmbassadorEntity(entity, await readBody(request)))
}

export async function getRoute(entity: AmbassadorEntity, id: string) {
  return ambassadorJson(await getAmbassadorEntity(entity, id))
}

export async function patchRoute(entity: AmbassadorEntity, id: string, request: Request, action = "updated") {
  return ambassadorJson(await updateAmbassadorEntity(entity, id, await readBody(request), action))
}

export async function archiveRoute(entity: AmbassadorEntity, id: string) {
  return ambassadorJson(await archiveAmbassadorEntity(entity, id))
}
