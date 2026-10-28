import { getSupplierContext, supplierSnapshot, executeSupplierCommand } from '@/angelcare-marketplace/supplier-command-360/server'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  const id = requestId(request)
  try { await getSupplierContext(); return apiSuccess(await supplierSnapshot(), {requestId:id}) }
  catch (e) { return apiFailure(e,id) }
}
export async function POST(request: Request) {
  const id = requestId(request)
  try { return apiSuccess(await executeSupplierCommand(await parseJsonObject(request)),{requestId:id}) }
  catch (e) { return apiFailure(e,id) }
}
