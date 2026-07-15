import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

async function guard(action: 'read' | 'create' | 'update' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

function splitMulti(value: unknown) {
  return String(value || '')
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean)
}

function parseContacts(row: Record<string, unknown>) {
  const contacts: Array<Record<string, unknown>> = []

  const decisionName = String(row.decision_maker_name || row.contact || row.contact_name || '').trim()
  const decisionRole = String(row.decision_maker_role || row.role || '').trim()
  const primaryEmail = String(row.email || '').trim()
  const primaryPhone = String(row.phone || row.mobile || row.tel || '').trim()

  if (decisionName || decisionRole || primaryEmail || primaryPhone) {
    contacts.push({
      name: decisionName || 'Contact principal',
      role: decisionRole || null,
      email: primaryEmail || null,
      phone: primaryPhone || null,
      mobile: primaryPhone || null,
      whatsapp: primaryPhone || null,
      is_primary: true,
      is_decision_maker: true,
      department: decisionName && decisionName.toLowerCase().includes('direction') ? decisionName : null,
    })
  }

  const extraContacts = String(row.contacts || row.extra_contacts || '').trim()
  if (extraContacts) {
    for (const contactChunk of extraContacts.split('|')) {
      const [name, role, email, phone, mobile, department, linkedin] = contactChunk.split(';').map((x) => String(x || '').trim())
      if (!name && !email && !phone && !mobile) continue

      contacts.push({
        name: name || 'Contact',
        role: role || null,
        email: email || null,
        phone: phone || mobile || null,
        mobile: mobile || phone || null,
        whatsapp: mobile || phone || null,
        department: department || null,
        linkedin: linkedin || null,
        is_primary: contacts.length === 0,
        is_decision_maker: /direction|directeur|directrice|manager|responsable|commercial/i.test(`${name} ${role} ${department}`),
      })
    }
  }

  const emails = splitMulti(row.emails)
  const phones = splitMulti(row.phones || row.mobiles || row.mobile_numbers)

  emails.forEach((email, index) => {
    if (contacts.some((c) => c.email === email)) return
    contacts.push({
      name: `Email contact ${index + 1}`,
      role: null,
      email,
      phone: phones[index] || null,
      mobile: phones[index] || null,
      whatsapp: phones[index] || null,
      is_primary: false,
      is_decision_maker: false,
    })
  })

  phones.forEach((phone, index) => {
    if (contacts.some((c) => c.phone === phone || c.mobile === phone)) return
    contacts.push({
      name: `Phone contact ${index + 1}`,
      role: null,
      email: null,
      phone,
      mobile: phone,
      whatsapp: phone,
      is_primary: false,
      is_decision_maker: false,
    })
  })

  return contacts
}

function normalizeRows(input: unknown) {
  if (!Array.isArray(input)) return []

  return input
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>

      const phones = Array.from(new Set([
        ...splitMulti(r.phones || r.mobiles || r.mobile_numbers),
        ...splitMulti(r.phone),
      ]))

      const emails = Array.from(new Set([
        ...splitMulti(r.emails),
        ...splitMulti(r.email),
      ]))

      const contacts = parseContacts(r)

      return {
        name: String(r.name || r.prospect || r.company || r.hotel || '').trim(),
        sector: String(r.sector || r.category || '').trim() || 'Other',
        city: String(r.city || '').trim() || null,
        phone: phones[0] || null,
        email: emails[0] || null,
        phones,
        emails,
        decision_maker_name: String(r.decision_maker_name || r.contact || r.contact_name || '').trim() || null,
        decision_maker_role: String(r.decision_maker_role || r.role || '').trim() || null,
        priority_score: String(r.priority_score || r.priority || 'B').trim() || 'B',
        contacts,
        raw: r,
      }
    })
    .filter(Boolean) as Array<Record<string, unknown>>
}

function validateRow(row: Record<string, unknown>) {
  const errors: string[] = []

  if (!String(row.name || '').trim()) errors.push('Missing prospect name')
  if (!String(row.sector || '').trim()) errors.push('Missing sector')

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db
      .from('b2b_import_batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[B2B_IMPORTS_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    console.error('[B2B_IMPORTS_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const rows = normalizeRows(body.rows)
    const validations = rows.map(validateRow)
    const validCount = validations.filter((v) => v.isValid).length
    const invalidCount = validations.length - validCount

    const batchPayload = {
      name: body.name || body.batch_name || `Import B2B ${new Date().toLocaleDateString('fr-FR')}`,
      source: body.source || 'manual_csv',
      segment: body.segment || body.category || 'general',
      status: 'staged',
      row_count: rows.length,
      valid_count: validCount,
      invalid_count: invalidCount,
      promoted_count: 0,
      notes: body.notes || null,
      created_by: g.actor.id,
      updated_at: new Date().toISOString(),
    }

    const { data: batch, error: batchError } = await g.db
      .from('b2b_import_batches')
      .insert(batchPayload)
      .select('*')
      .single()

    if (batchError) {
      console.error('[B2B_IMPORTS_BATCH_CREATE_FAILED]', batchError)
      return NextResponse.json({ ok: false, error: batchError.message, details: batchError }, { status: 500 })
    }

    if (rows.length) {
      const importRows = rows.map((row, index) => {
        const validation = validations[index]

        return {
          batch_id: batch.id,
          row_index: index + 1,
          raw_data: row.raw || row,
          normalized_data: row,
          validation_status: validation.isValid ? 'valid' : 'invalid',
          validation_errors: validation.errors,
          updated_at: new Date().toISOString(),
        }
      })

      const { error: rowsError } = await g.db.from('b2b_import_rows').insert(importRows)

      if (rowsError) {
        console.error('[B2B_IMPORT_ROWS_CREATE_FAILED]', rowsError)
        return NextResponse.json({ ok: false, error: rowsError.message, details: rowsError, data: batch }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...batch,
        row_count: rows.length,
        valid_count: validCount,
        invalid_count: invalidCount,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[B2B_IMPORTS_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create import.' }, { status: 500 })
  }
}
