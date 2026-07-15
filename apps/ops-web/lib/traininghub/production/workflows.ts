import { code, insertAny, insertRow, logEvent, minor, now, selectRows, text, updateRow, type Row } from './server'

export async function createPartner(supabase: any, input: Row) {
  const name = text(input.name || input.partner_name || input.legal_name, 'Nouveau partenaire TrainingHub')
  const organization = await insertRow(supabase, 'core_organizations', {
    name,
    legal_name: text(input.legal_name, name),
    display_name: text(input.display_name, name),
    city: text(input.city, 'Rabat'),
    country: 'MA',
    organization_type: text(input.organization_type, 'partner_school'),
    partner_type: text(input.partner_type, 'school_partner'),
    status: text(input.status, 'active'),
    stage: text(input.stage, 'onboarding'),
    metadata: { source: 'traininghub_production_real_layer', ...input.metadata },
    created_at: now(),
    updated_at: now(),
  })
  if (!organization.ok) return organization

  const account = await insertRow(supabase, 'bill_accounts', {
    organization_id: organization.data?.id,
    account_name: name,
    account_type: 'traininghub_partner',
    status: 'active',
    currency: 'MAD',
    balance_minor: 0,
    metadata: { source: 'traininghub_production_real_layer' },
    created_at: now(),
    updated_at: now(),
  })

  await logEvent(supabase, { module: 'partners', action: 'partner_created', organization_id: organization.data?.id, entity_id: organization.data?.id, status: 'created' })
  return { ok: true, data: { organization: organization.data, account: account.data || null }, warning: account.ok ? undefined : account.error }
}

export async function readDossier(supabase: any, organizationId: string) {
  const data: Row = { organization_id: organizationId }
  const main = await selectRows(supabase, 'core_organizations', ['id', organizationId], 1)
  data.organization = main.data?.[0] || null
  const tables: Record<string, string> = {
    memberships: 'core_memberships',
    accounts: 'bill_accounts',
    subscriptions: 'bill_subscriptions',
    proposals: 'bill_proposals',
    orders: 'bill_orders',
    invoices: 'bill_invoices',
    payments: 'bill_payments',
    credits: 'bill_training_credits',
    sessions: 'trn_sessions',
    participants: 'trn_session_participants',
    certificates: 'trn_certificates',
    requests: 'partner_requests',
    documents: 'partner_documents',
    notifications: 'partner_notifications',
  }
  for (const [key, table] of Object.entries(tables)) {
    const rows = await selectRows(supabase, table, ['organization_id', organizationId], 100)
    data[key] = rows.data || []
  }
  return { ok: true, data }
}

export async function createOffer(supabase: any, input: Row) {
  const organizationId = text(input.organization_id || input.partner_id)
  if (!organizationId) return { table: 'unknown', ok: false, data: null, attempts: [], error: 'organization_id requis.' }
  const amount = minor(input.amount || input.total || input.price || 7200)
  const proposalNumber = text(input.proposal_number, code('TH-OFFRE'))

  const proposal = await insertRow(supabase, 'bill_proposals', {
    organization_id: organizationId,
    partner_id: organizationId,
    proposal_number: proposalNumber,
    title: text(input.title, 'Offre TrainingHub partenaire'),
    status: text(input.status, 'draft'),
    currency: 'MAD',
    subtotal_minor: amount,
    total_minor: amount,
    grand_total_minor: amount,
    valid_until: input.valid_until || null,
    notes: input.notes || null,
    metadata: { source: 'traininghub_offer_builder', course_id: input.course_id || null, participants: input.participants || 0, format: input.format || 'onsite' },
    created_at: now(),
    updated_at: now(),
  })
  if (!proposal.ok) return proposal

  const item = await insertRow(supabase, 'bill_proposal_items', {
    proposal_id: proposal.data?.id,
    organization_id: organizationId,
    item_type: text(input.item_type, 'training_course'),
    source_type: text(input.source_type, 'traininghub_course'),
    course_id: input.course_id || null,
    title: text(input.item_title || input.course_title, 'Formation TrainingHub'),
    description: text(input.description, 'Prestation formation AngelCare TrainingHub'),
    quantity: Number(input.quantity || input.participants || 1),
    unit_price_minor: amount,
    subtotal_minor: amount,
    total_minor: amount,
    currency: 'MAD',
    metadata: { source: 'traininghub_offer_builder' },
    created_at: now(),
    updated_at: now(),
  })

  await logEvent(supabase, { module: 'offres', action: 'offer_created', organization_id: organizationId, entity_id: proposal.data?.id, status: 'created' })
  return { ok: true, data: { proposal: proposal.data, item: item.data || null }, warning: item.ok ? undefined : item.error }
}

export async function convertOffer(supabase: any, proposalId: string, input: Row) {
  const proposalRows = await selectRows(supabase, 'bill_proposals', ['id', proposalId], 1)
  const proposal = proposalRows.data?.[0] || {}
  const organizationId = text(input.organization_id || proposal.organization_id || proposal.partner_id)
  if (!organizationId) return { table: 'unknown', ok: false, data: null, attempts: [], error: 'organization_id introuvable.' }
  const amount = Number(input.amount_minor || proposal.grand_total_minor || proposal.total_minor || proposal.subtotal_minor || minor(input.amount || 7200))

  const order = await insertRow(supabase, 'bill_orders', {
    organization_id: organizationId,
    partner_id: organizationId,
    proposal_id: proposalId,
    order_number: text(input.order_number, code('TH-CMD')),
    status: text(input.order_status, 'confirmed'),
    currency: 'MAD',
    subtotal_minor: amount,
    total_minor: amount,
    grand_total_minor: amount,
    metadata: { source: 'traininghub_offer_conversion', proposal_id: proposalId },
    created_at: now(),
    updated_at: now(),
  })
  if (!order.ok) return order

  const invoice = await insertRow(supabase, 'bill_invoices', {
    organization_id: organizationId,
    partner_id: organizationId,
    order_id: order.data?.id,
    proposal_id: proposalId,
    invoice_number: text(input.invoice_number, code('TH-FAC')),
    status: text(input.invoice_status, 'issued'),
    currency: 'MAD',
    subtotal_minor: amount,
    tax_minor: 0,
    total_minor: amount,
    amount_due_minor: amount,
    grand_total_minor: amount,
    issued_at: now(),
    metadata: { source: 'traininghub_offer_conversion', order_id: order.data?.id, proposal_id: proposalId },
    created_at: now(),
    updated_at: now(),
  })

  const credit = await insertRow(supabase, 'bill_training_credits', {
    organization_id: organizationId,
    partner_id: organizationId,
    order_id: order.data?.id,
    invoice_id: invoice.data?.id || null,
    proposal_id: proposalId,
    credit_type: text(input.credit_type, 'training_course'),
    source_type: text(input.source_type, 'order_conversion'),
    status: text(input.credit_status, 'available'),
    quantity_total: Number(input.quantity_total || input.credits || 1),
    quantity_available: Number(input.quantity_available || input.credits || 1),
    quantity_used: 0,
    amount_minor: amount,
    currency: 'MAD',
    metadata: { source: 'traininghub_offer_conversion' },
    created_at: now(),
    updated_at: now(),
  })

  await updateRow(supabase, 'bill_proposals', proposalId, { status: 'converted_to_order', converted_order_id: order.data?.id, updated_at: now() })
  await logEvent(supabase, { module: 'commercial', action: 'offer_converted', organization_id: organizationId, entity_id: proposalId, status: 'converted' })
  return { ok: true, data: { order: order.data, invoice: invoice.data || null, credit: credit.data || null }, warning: [invoice.ok ? '' : invoice.error, credit.ok ? '' : credit.error].filter(Boolean).join(' | ') || undefined }
}

export async function upsertCourse(supabase: any, input: Row) {
  const course = await insertAny(supabase, ['trn_courses', 'training_courses', 'academy_courses'], {
    reference: text(input.reference || input.course_code, code('TH-COURSE')),
    course_code: text(input.course_code || input.reference, code('TH-COURSE')),
    title: text(input.title, 'Formation TrainingHub'),
    name: text(input.name || input.title, 'Formation TrainingHub'),
    category: text(input.category, 'TrainingHub'),
    description: text(input.description, 'Formation AngelCare TrainingHub'),
    duration_hours: Number(input.duration_hours || input.hours || 3),
    format: text(input.format, 'onsite'),
    price_minor: minor(input.price || 0),
    currency: 'MAD',
    max_participants: Number(input.max_participants || 12),
    certificate_rule: input.certificate_rule || 'attendance_validated',
    refresh_rule: input.refresh_rule || 'annual',
    status: text(input.status, 'published'),
    visibility: text(input.visibility, 'internal_and_partner'),
    metadata: { source: 'traininghub_catalogue_crud' },
    created_at: now(),
    updated_at: now(),
  })
  if (course.ok) await logEvent(supabase, { module: 'catalogue', action: 'course_upserted', entity_id: (course as any).data?.id, status: 'saved' })
  return course.ok ? { ok: true, data: { course: (course as any).data, table: (course as any).table } } : course
}

export async function planSession(supabase: any, input: Row) {
  const organizationId = text(input.organization_id || input.partner_id)
  if (!organizationId) return { table: 'unknown', ok: false, data: null, attempts: [], error: 'organization_id requis.' }
  const session = await insertRow(supabase, 'trn_sessions', {
    organization_id: organizationId,
    partner_id: organizationId,
    course_id: input.course_id || null,
    credit_id: input.credit_id || null,
    session_code: text(input.session_code, code('TH-SESS')),
    title: text(input.title, 'Session TrainingHub'),
    status: text(input.status, 'planned'),
    mode: text(input.mode, 'onsite'),
    location: text(input.location, 'Site partenaire'),
    scheduled_start_at: input.scheduled_start_at || input.start_at || now(),
    scheduled_end_at: input.scheduled_end_at || input.end_at || null,
    trainer_id: input.trainer_id || null,
    max_participants: Number(input.max_participants || input.participants?.length || 12),
    metadata: { source: 'traininghub_session_planner' },
    created_at: now(),
    updated_at: now(),
  })
  if (!session.ok) return session

  const participants = []
  for (const participant of Array.isArray(input.participants) ? input.participants : []) {
    const inserted = await insertRow(supabase, 'trn_session_participants', {
      organization_id: organizationId,
      partner_id: organizationId,
      session_id: session.data?.id,
      full_name: text(participant.full_name || participant.name, 'Participant TrainingHub'),
      role: text(participant.role, 'Équipe partenaire'),
      email: participant.email || null,
      phone: participant.phone || null,
      attendance_status: 'registered',
      certificate_status: 'pending',
      status: 'registered',
      metadata: { source: 'traininghub_session_planner' },
      created_at: now(),
      updated_at: now(),
    })
    if (inserted.ok) participants.push((inserted as any).data)
  }
  await logEvent(supabase, { module: 'sessions', action: 'session_planned', organization_id: organizationId, entity_id: session.data?.id, status: 'planned' })
  return { ok: true, data: { session: session.data, participants } }
}

export async function validateAttendance(supabase: any, input: Row) {
  const sessionId = text(input.session_id)
  if (!sessionId) return { table: 'unknown', ok: false, data: null, attempts: [], error: 'session_id requis.' }
  const updated = []
  for (const participant of Array.isArray(input.participants) ? input.participants : []) {
    if (!participant.id) continue
    const row = await updateRow(supabase, 'trn_session_participants', participant.id, {
      attendance_status: text(participant.attendance_status, participant.present === false ? 'absent' : 'present'),
      presence_status: text(participant.presence_status, participant.present === false ? 'absent' : 'present'),
      status: text(participant.status, participant.present === false ? 'absent' : 'present'),
      validated_at: now(),
      validation_notes: participant.notes || null,
      updated_at: now(),
    })
    if (row.ok) updated.push(row.data)
  }
  await updateRow(supabase, 'trn_sessions', sessionId, { status: 'attendance_validated', attendance_validated_at: now(), updated_at: now() })
  await logEvent(supabase, { module: 'attendance', action: 'attendance_validated', entity_id: sessionId, status: 'validated' })
  return { ok: true, data: { session_id: sessionId, participants: updated } }
}

export async function issueCertificates(supabase: any, input: Row) {
  const organizationId = text(input.organization_id || input.partner_id)
  if (!organizationId) return { table: 'unknown', ok: false, data: null, attempts: [], error: 'organization_id requis.' }
  const issued = []
  for (const participant of Array.isArray(input.participants) ? input.participants : []) {
    const cert = await insertRow(supabase, 'trn_certificates', {
      organization_id: organizationId,
      partner_id: organizationId,
      session_id: input.session_id || participant.session_id || null,
      participant_id: participant.id || participant.participant_id || null,
      course_id: input.course_id || participant.course_id || null,
      certificate_number: text(participant.certificate_number, code('TH-CERT')),
      title: text(input.title, 'Certificat TrainingHub AngelCare'),
      participant_name: text(participant.full_name || participant.name, 'Participant TrainingHub'),
      status: text(input.status, 'issued'),
      issued_at: now(),
      refresh_due_at: input.refresh_due_at || null,
      metadata: { source: 'traininghub_certificate_issue', participant },
      created_at: now(),
      updated_at: now(),
    })
    if (cert.ok) issued.push(cert.data)
  }
  await logEvent(supabase, { module: 'certificates', action: 'certificates_issued', organization_id: organizationId, entity_id: input.session_id || null, status: 'issued' })
  return { ok: true, data: { certificates: issued } }
}

export async function publishDocument(supabase: any, input: Row) {
  const organizationId = text(input.organization_id || input.partner_id)
  if (!organizationId) return { table: 'unknown', ok: false, data: null, attempts: [], error: 'organization_id requis.' }
  const document = await insertRow(supabase, 'partner_documents', {
    organization_id: organizationId,
    document_type: text(input.document_type, 'proof_kit'),
    title: text(input.title, 'Document TrainingHub'),
    status: text(input.status, 'published'),
    file_url: input.file_url || null,
    related_entity_type: input.related_entity_type || null,
    related_entity_id: input.related_entity_id || null,
    published_at: now(),
    metadata: { source: 'traininghub_document_publication' },
    created_at: now(),
    updated_at: now(),
  })
  if (document.ok) await logEvent(supabase, { module: 'documents', action: 'document_published', organization_id: organizationId, entity_id: document.data?.id, status: 'published' })
  return document.ok ? { ok: true, data: { document: document.data } } : document
}

export async function resolveRequest(supabase: any, requestId: string, input: Row) {
  const updated = await updateRow(supabase, 'partner_requests', requestId, {
    status: text(input.status, 'resolved'),
    resolution_notes: input.resolution_notes || input.notes || null,
    resolved_at: now(),
    updated_at: now(),
  })
  if (updated.ok) await logEvent(supabase, { module: 'requests', action: 'partner_request_resolved', entity_id: requestId, status: 'resolved' })
  return updated.ok ? { ok: true, data: { request: updated.data } } : updated
}
