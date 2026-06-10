import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function option(row: AnyRecord, labelKeys: string[], metaKeys: string[] = []) {
  const label = labelKeys.map((key) => row[key]).find(Boolean) || `#${row.id}`
  const meta = metaKeys.map((key) => row[key]).filter(Boolean).join(' · ')
  return {
    id: row.id,
    label: String(label),
    meta,
    city: row.city || null,
    zone: row.zone || null,
    phone: row.phone || row.mobile || null,
    status: row.current_status || row.status || null,
    skills: Array.isArray(row.skill_tags) ? row.skill_tags : [],
  }
}

async function safeList(table: string, select: string, orderColumn: string, mapper: (row: AnyRecord) => AnyRecord) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select(select).order(orderColumn, { ascending: true }).limit(100)
    if (error) return []
    return (data || []).map(mapper)
  } catch {
    return []
  }
}

export async function GET() {
  const [families, caregivers, contracts, submissionTemplates] = await Promise.all([
    safeList('families', 'id,family_name,parent_name,city,zone,phone,is_archived', 'id', (row) => option(row, ['family_name', 'parent_name'], ['parent_name', 'city', 'zone'])),
    safeList('caregivers', 'id,full_name,city,current_status,status,skill_tags,is_archived', 'full_name', (row) => option(row, ['full_name'], ['city', 'current_status', 'status'])),
    safeList('contracts', 'id,contract_number,reference,status,family_id', 'id', (row) => option(row, ['contract_number', 'reference'], ['status'])),
    safeList('mission_submission_templates', 'id,title,name,category,status', 'id', (row) => option(row, ['title', 'name'], ['category', 'status'])),
  ])

  return NextResponse.json({
    ok: true,
    data: {
      families: families.filter((item: AnyRecord) => item.status !== 'archived'),
      caregivers: caregivers.filter((item: AnyRecord) => item.status !== 'archived'),
      contracts,
      submissionTemplates,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
