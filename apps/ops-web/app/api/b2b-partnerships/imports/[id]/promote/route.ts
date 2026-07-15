import { NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const permission = requireB2BPermission('create', {
      actorId: actor.id,
      actorRole: actor.role || actor.role_key,
      permissions: actor.permissions,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const { data: rows, error: rowsError } = await db
      .from('b2b_import_rows')
      .select('*')
      .eq('batch_id', id)
      .eq('validation_status', 'valid')
      .is('promoted_prospect_id', null)

    if (rowsError) {
      console.error('[B2B_IMPORT_PROMOTE_ROWS_LOAD_FAILED]', rowsError)
      return NextResponse.json({ ok: false, error: 'Unable to load valid import rows.' }, { status: 500 })
    }

    const createdProspects: unknown[] = []
    let createdContacts = 0

    for (const row of rows || []) {
      const normalized = row.normalized_data || row.raw_data || {}

      const name = String(normalized.name || '').trim()
      if (!name) continue

      const prospectPayload = {
        name,
        sector: normalized.sector || 'Other',
        city: normalized.city || null,
        phone: normalized.phone || null,
        email: normalized.email || null,
        phones: normalized.phones || [],
        emails: normalized.emails || [],
        contacts_summary: normalized.contacts || [],
        decision_maker_name: normalized.decision_maker_name || null,
        decision_maker_role: normalized.decision_maker_role || null,
        status: 'New',
        priority_score: normalized.priority_score || 'B',
        relationship_warmth: 'Cold',
        estimated_monthly_value: 0,
        estimated_annual_value: 0,
        assigned_owner_id: actor.id,
        created_by: actor.id,
        updated_by: actor.id,
      }

      const { data: prospect, error: prospectError } = await db
        .from('b2b_prospects')
        .insert(prospectPayload)
        .select('*')
        .single()

      if (prospectError) {
        console.error('[B2B_IMPORT_PROMOTE_PROSPECT_FAILED]', prospectError)
        continue
      }

      createdProspects.push(prospect)

      const contacts = Array.isArray(normalized.contacts) ? normalized.contacts : []

      if (contacts.length) {
        const contactRows = contacts.map((contact: Record<string, unknown>, index: number) => ({
          prospect_id: prospect.id,
          name: contact.name || `Contact ${index + 1}`,
          role: contact.role || null,
          email: contact.email || null,
          phone: contact.phone || null,
          mobile: contact.mobile || contact.phone || null,
          whatsapp: contact.whatsapp || contact.mobile || contact.phone || null,
          linkedin: contact.linkedin || null,
          department: contact.department || null,
          is_primary: Boolean(contact.is_primary || index === 0),
          is_decision_maker: Boolean(contact.is_decision_maker),
          created_by: actor.id,
          updated_at: new Date().toISOString(),
        }))

        const { error: contactsError } = await db.from('b2b_contacts').insert(contactRows)

        if (contactsError) {
          console.error('[B2B_IMPORT_PROMOTE_CONTACTS_FAILED]', contactsError)
        } else {
          createdContacts += contactRows.length
        }
      }

      await db
        .from('b2b_import_rows')
        .update({
          promoted_prospect_id: prospect.id,
          validation_status: 'promoted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
    }

    await db
      .from('b2b_import_batches')
      .update({
        status: 'promoted',
        promoted_count: createdProspects.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      ok: true,
      data: {
        promoted_count: createdProspects.length,
        contacts_created: createdContacts,
        prospects: createdProspects,
      },
    })
  } catch (error) {
    console.error('[B2B_IMPORT_PROMOTE_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to promote import rows.' }, { status: 500 })
  }
}
