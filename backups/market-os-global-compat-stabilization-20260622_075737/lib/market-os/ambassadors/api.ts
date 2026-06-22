import { NextResponse } from "next/server"

export type AnyAmbassadorPayload = Record<string, any>

function ok(payload: AnyAmbassadorPayload = {}) {
  return NextResponse.json({ ok: true, source: 'ambassadors-api-compat', ...payload })
}

function readId(params: any) {
  return params?.id || params?.params?.id || ''
}

export type ambassadorJsonType = any
export async function ambassadorJson(request?: Request, context?: any) {
  return ok({ operation: 'ambassadorJson', id: readId(context), records: [], items: [] })
}

export type archiveRouteType = any
export async function archiveRoute(request?: Request, context?: any) {
  return ok({ operation: 'archiveRoute', id: readId(context), records: [], items: [] })
}

export type createRouteType = any
export async function createRoute(request?: Request, context?: any) {
  return ok({ operation: 'createRoute', id: readId(context), records: [], items: [] })
}

export type getRouteType = any
export async function getRoute(request?: Request, context?: any) {
  return ok({ operation: 'getRoute', id: readId(context), records: [], items: [] })
}

export type listRouteType = any
export async function listRoute(request?: Request, context?: any) {
  return ok({ operation: 'listRoute', id: readId(context), records: [], items: [] })
}

export type patchRouteType = any
export async function patchRoute(request?: Request, context?: any) {
  return ok({ operation: 'patchRoute', id: readId(context), records: [], items: [] })
}

export type readBodyType = any
export async function readBody(request?: Request, context?: any) {
  return ok({ operation: 'readBody', id: readId(context), records: [], items: [] })
}


export async function handleAmbassadorApi(request?: Request, context?: any) {
  return ok({ operation: "handleAmbassadorApi", id: readId(context), records: [], items: [] })
}

export default {
  handleAmbassadorApi,
}
