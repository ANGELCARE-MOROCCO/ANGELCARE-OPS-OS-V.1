import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function uniqueNumbers(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .map((value: any) => Number(value))
        .filter((value: any) => Number.isSafeInteger(value) && value > 0),
    ),
  )
}

function cleanCode(value: unknown) {
  return String(value || '').trim()
}

function baseCode(value: unknown) {
  return cleanCode(value).replace(/\*(S|\d+)$/i, '')
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const selectedRows = Array.isArray(body?.missions) ? body.missions : []
    const ids = uniqueNumbers([
      ...(Array.isArray(body?.ids) ? body.ids : []),
      ...selectedRows.map((row: any) => row?.id || row?.mission_id || row?.missionId),
    ])

    const references = Array.from(
      new Set(
        [
          ...(Array.isArray(body?.references) ? body.references : []),
          ...selectedRows.flatMap((row: any) => [
            row?.code,
            row?.mission_reference,
            row?.missionReference,
            row?.dossier_reference,
            row?.dossierReference,
          ]),
        ]
          .map(cleanCode)
          .filter(Boolean),
      ),
    )

    const baseReferences = Array.from(new Set(references.map(baseCode).filter(Boolean)))

    const groupIds = Array.from(
      new Set(
        selectedRows
          .map((row: any) => cleanCode(row?.mission_group_id || row?.missionGroupId))
          .filter(Boolean),
      ),
    )

    if (!ids.length && !references.length && !groupIds.length) {
      return NextResponse.json(
        { ok: false, error: 'No mission identifiers received for deletion.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const supabase = await createClient()

    const orParts: string[] = []

    if (ids.length) {
      orParts.push(`id.in.(${ids.join(',')})`)
      orParts.push(`parent_mission_id.in.(${ids.join(',')})`)
    }

    if (references.length) {
      orParts.push(`mission_reference.in.(${references.map((value: any) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`)
      orParts.push(`dossier_reference.in.(${references.map((value: any) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`)
    }

    if (baseReferences.length) {
      orParts.push(`mission_reference.in.(${baseReferences.map((value: any) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`)
      orParts.push(`dossier_reference.in.(${baseReferences.map((value: any) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`)
    }

    if (groupIds.length) {
      orParts.push(`mission_group_id.in.(${groupIds.map((value: any) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`)
    }

    const { data: matchedRows, error: matchError } = await supabase
      .from('missions')
      .select('id,parent_mission_id,mission_group_id,mission_reference,dossier_reference,status,is_archived')
      .or(orParts.join(','))

    if (matchError) throw new Error(matchError.message)

    const matched = Array.isArray(matchedRows) ? matchedRows : []

    const parentIds = uniqueNumbers(
      matched.flatMap((row: any) => [row.id, row.parent_mission_id]).filter(Boolean),
    )

    const matchedGroupIds = Array.from(
      new Set(
        matched
          .map((row: any) => cleanCode(row.mission_group_id))
          .filter(Boolean),
      ),
    )

    const secondOrParts: string[] = []

    if (parentIds.length) {
      secondOrParts.push(`id.in.(${parentIds.join(',')})`)
      secondOrParts.push(`parent_mission_id.in.(${parentIds.join(',')})`)
    }

    if (matchedGroupIds.length) {
      secondOrParts.push(`mission_group_id.in.(${matchedGroupIds.map((value: any) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`)
    }

    let finalRows = matched

    if (secondOrParts.length) {
      const { data: expandedRows, error: expandedError } = await supabase
        .from('missions')
        .select('id,parent_mission_id,mission_group_id,mission_reference,dossier_reference,status,is_archived')
        .or(secondOrParts.join(','))

      if (expandedError) throw new Error(expandedError.message)

      const map = new Map<number, any>()
      for (const row of [...matched, ...(Array.isArray(expandedRows) ? expandedRows : [])]) {
        if (Number(row?.id)) map.set(Number(row.id), row)
      }
      finalRows = Array.from(map.values())
    }

    const finalIds = uniqueNumbers(finalRows.map((row: any) => row.id))

    if (!finalIds.length) {
      return NextResponse.json(
        { ok: false, error: 'No matching missions found for received selection.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const now = new Date().toISOString()

    const deletePatch = {
      status: 'deleted',
      lifecycle_stage: 'deleted',
      dossier_status: 'deleted',
      is_archived: true,
      updated_at: now,
    }

    const { data: archived, error: archiveError } = await supabase
      .from('missions')
      .update(deletePatch)
      .in('id', finalIds)
      .select('id,mission_reference,dossier_reference,status,is_archived')

    if (archiveError) throw new Error(archiveError.message)

    // Optional satellite cleanup. Missing tables/columns are skipped safely.
    const satelliteResults: any[] = []
    for (const table of [
      'mission_routes',
      'mission_allowances',
      'mission_program_lines',
      'mission_parameters',
      'mission_parameter_days',
      'mission_transport',
      'carelink_mission_reports',
      'carelink_dispatch_messages',
      'carelink_notifications',
      'carelink_alerts',
      'carelink_mission_checklist_items',
      'carelink_mission_checklists',
    ]) {
      const { data, error } = await supabase.from(table).delete().in('mission_id', finalIds).select('id')
      if (error) {
        satelliteResults.push({ table, skipped: true, error: error.message })
      } else {
        satelliteResults.push({ table, skipped: false, count: Array.isArray(data) ? data.length : 0 })
      }
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          requestedIds: ids,
          requestedReferences: references,
          matchedMissionIds: finalIds,
          deletedMissionIds: finalIds,
          deletedCount: Array.isArray(archived) ? archived.length : finalIds.length,
          mode: 'production_archive_delete_sync',
          satelliteResults,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Production mission deletion failed.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
