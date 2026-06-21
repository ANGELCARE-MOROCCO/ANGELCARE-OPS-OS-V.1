import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

async function resolveProgramId(context: RouteContext) {
  const params = await context.params
  return String(params.id || '').trim()
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = await resolveProgramId(context)

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Missing academy course/program id' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('academy_programs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      source: 'academy_programs',
      compatibility: 'academy_courses',
      data,
    })
  } catch (error) {
    console.error('[ACADEMY_COURSE_COMPAT_GET_FAILED]', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load academy course compatibility record',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = await resolveProgramId(context)

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Missing academy course/program id' },
        { status: 400 },
      )
    }

    const payload = await request.json().catch(() => ({}))
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('academy_programs')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      source: 'academy_programs',
      compatibility: 'academy_courses',
      data,
    })
  } catch (error) {
    console.error('[ACADEMY_COURSE_COMPAT_PATCH_FAILED]', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to update academy course compatibility record',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = await resolveProgramId(context)

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Missing academy course/program id' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('academy_programs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      source: 'academy_programs',
      compatibility: 'academy_courses',
      deletedId: id,
    })
  } catch (error) {
    console.error('[ACADEMY_COURSE_COMPAT_DELETE_FAILED]', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to delete academy course compatibility record',
      },
      { status: 500 },
    )
  }
}
