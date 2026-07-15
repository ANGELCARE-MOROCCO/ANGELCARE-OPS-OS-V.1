import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeProgram(row: any) {
  const title =
    row?.program_name ||
    row?.title ||
    row?.name ||
    row?.course_name ||
    row?.label ||
    `Program ${row?.id}`

  return {
    id: row.id,
    title,
    name: title,
    program_name: title,
    reference_number:
      row?.reference_number ||
      row?.program_reference ||
      row?.reference ||
      row?.code ||
      `PRG-${row?.id}`,
    category: row?.category || row?.program_category || '',
    level: row?.level || '',
    status: row?.status || 'active',
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('academy_programs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, data: [] }, { status: 500 })
    }

    const rows = (data || [])
      .map(normalizeProgram)
      .filter((program) => program.id !== undefined && program.id !== null)

    return NextResponse.json({
      ok: true,
      data: rows,
      programs: rows,
      count: rows.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Unable to load trainer program options', data: [] },
      { status: 500 },
    )
  }
}
