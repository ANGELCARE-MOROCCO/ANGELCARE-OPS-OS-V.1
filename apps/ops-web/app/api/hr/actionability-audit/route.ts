import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'reports', 'hr-actionability-audit.json')
    if (!fs.existsSync(file)) {
      return NextResponse.json({ ok: true, message: 'Run node scripts/hr-total-actionability-audit.mjs to generate the latest report.', totals: null })
    }
    return NextResponse.json(JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Could not read HR actionability report' }, { status: 500 })
  }
}
