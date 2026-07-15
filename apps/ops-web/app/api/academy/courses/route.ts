/*
 * Academy courses compatibility API.
 *
 * Production canonical model:
 * - academy_programs is the source of truth.
 * - /api/academy/courses exists only to protect older clients from 404s.
 * - New Academy UI/API code should use /api/academy/programs.
 */
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('academy_programs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      source: 'academy_programs',
      compatibility: 'academy_courses',
      data: data || [],
    })
  } catch (error) {
    console.error('[ACADEMY_COURSES_COMPAT_GET_FAILED]', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load Academy programs compatibility list',
        source: 'academy_programs',
        compatibility: 'academy_courses',
        data: [],
      },
      { status: 500 },
    )
  }
}
