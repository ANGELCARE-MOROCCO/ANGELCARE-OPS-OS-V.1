import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import {
  cancelLibraryLoanAtomic,
  createLibraryBook,
  createLibraryCopy,
  createLibraryLoanAtomic,
  findLibraryCopyByBarcode,
  getLibraryCommandSnapshot,
  markLibraryLoanLostAtomic,
  returnLibraryLoanAtomic,
  updateLibraryBook,
  updateLibraryCopy,
} from '@/lib/angelcare360/server/library-circulation-command'

export const dynamic = 'force-dynamic'

function failure(error: unknown, status = 400) {
  const message = publicAngelcare360Error(error)
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'snapshot'
    const schoolId = request.nextUrl.searchParams.get('schoolId')
    if (mode === 'barcode') {
      const query = request.nextUrl.searchParams.get('query') || ''
      const copy = await findLibraryCopyByBarcode(query, schoolId)
      return NextResponse.json({ ok: true, copy }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const snapshot = await getLibraryCommandSnapshot({ schoolId })
    return NextResponse.json({ ok: true, snapshot }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return failure(error, 403)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = String(body?.action || '')
    let result
    switch (action) {
      case 'book.create':
        result = await createLibraryBook(body)
        break
      case 'book.update':
        result = await updateLibraryBook(body)
        break
      case 'copy.create':
        result = await createLibraryCopy(body)
        break
      case 'copy.update':
        result = await updateLibraryCopy(body)
        break
      case 'loan.create':
        result = await createLibraryLoanAtomic(body)
        break
      case 'loan.return':
        result = await returnLibraryLoanAtomic(body)
        break
      case 'loan.lost':
        result = await markLibraryLoanLostAtomic(body)
        break
      case 'loan.cancel':
        result = await cancelLibraryLoanAtomic(body)
        break
      default:
        return NextResponse.json({ ok: false, error: 'Action Bibliothèque inconnue.' }, { status: 400 })
    }
    return NextResponse.json(result, { status: result.ok ? 200 : result.locked ? 423 : 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return failure(error)
  }
}
