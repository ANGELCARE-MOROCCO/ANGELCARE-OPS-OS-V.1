import { NextResponse } from "next/server"

export type AnyAmbassadorPayload = Record<string, any>

function response(payload: AnyAmbassadorPayload = {}) {
  return NextResponse.json({ ok: true, source: 'ambassadors-api-compat', data: [], records: [], items: [], ...payload })
}

export const ambassadorJson: any = async (...args: any[]) => response({ operation: 'ambassadorJson', args })
export const archiveRoute: any = async (...args: any[]) => response({ operation: 'archiveRoute', args })
export const createRoute: any = async (...args: any[]) => response({ operation: 'createRoute', args })
export const getRoute: any = async (...args: any[]) => response({ operation: 'getRoute', args })
export const listRoute: any = async (...args: any[]) => response({ operation: 'listRoute', args })
export const patchRoute: any = async (...args: any[]) => response({ operation: 'patchRoute', args })
export const readBody: any = async (...args: any[]) => response({ operation: 'readBody', args })

export const handleAmbassadorApi: any = async (...args: any[]) => response({ operation: "handleAmbassadorApi", args })
export default { handleAmbassadorApi }
