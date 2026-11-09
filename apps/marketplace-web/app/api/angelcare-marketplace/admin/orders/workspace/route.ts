import { transactionFlightDeckSnapshot } from '@/angelcare-marketplace/transaction-flight-deck/repository'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const id = requestId(request)
  try { return apiSuccess(await transactionFlightDeckSnapshot({allHistory:true}),{requestId:id}) }
  catch (error) { return apiFailure(error,id) }
}
