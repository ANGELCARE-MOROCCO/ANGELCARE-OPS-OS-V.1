'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'


function toBool(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1'
}

export async function updateAdvancedMission(formData: FormData) {
  const supabase = await createClient()

  const missionId = Number(formData.get('mission_id'))
  if (!missionId) throw new Error('Mission ID manquant')

  // 1) update mission main fields
  const missionPayload = {
    service_type: String(formData.get('service_type') || ''),
    mission_date: String(formData.get('mission_date') || '') || null,
    start_time: String(formData.get('start_time') || '') || null,
    end_time: String(formData.get('end_time') || '') || null,
    status: String(formData.get('status') || 'draft'),
    urgency: String(formData.get('urgency') || 'normal'),
    city: String(formData.get('city') || '') || null,
    zone: String(formData.get('zone') || '') || null,
    caregiver_id: formData.get('caregiver_id') ? Number(formData.get('caregiver_id')) : null,
    family_id: formData.get('family_id') ? Number(formData.get('family_id')) : null,
    notes: String(formData.get('notes') || '') || null,
    staff_id: String(formData.get('staff_id') || '') || null,
    grade_level: String(formData.get('grade_level') || '') || null,
    staff_status: String(formData.get('staff_status') || '') || null,
    personal_address: String(formData.get('personal_address') || '') || null,
    mobile: String(formData.get('mobile') || '') || null,
    home_address: String(formData.get('home_address') || '') || null,
    mission_reference: String(formData.get('mission_reference') || '') || null,
  }

  const { error: missionError } = await supabase
    .from('missions')
    .update(missionPayload)
    .eq('id', missionId)

  if (missionError) throw new Error(missionError.message)

  // 2) replace routes
  await supabase.from('mission_routes').delete().eq('mission_id', missionId)

  const routeLabels = formData.getAll('route_operation_label').map(String)
  const routeDates = formData.getAll('route_mission_date').map(String)
  const routeOutDeparture = formData.getAll('route_outbound_departure').map(String)
  const routeOutArrival = formData.getAll('route_outbound_arrival').map(String)
  const routeReturnDeparture = formData.getAll('route_return_departure').map(String)
  const routeReturnArrival = formData.getAll('route_return_arrival').map(String)

  const routesToInsert = routeLabels
    .map((label, index) => ({
      mission_id: missionId,
      line_order: index,
      operation_label: label || null,
      mission_date: routeDates[index] || null,
      outbound_departure: routeOutDeparture[index] || null,
      outbound_arrival: routeOutArrival[index] || null,
      return_departure: routeReturnDeparture[index] || null,
      return_arrival: routeReturnArrival[index] || null,
    }))
    .filter((row) =>
      row.operation_label ||
      row.mission_date ||
      row.outbound_departure ||
      row.outbound_arrival ||
      row.return_departure ||
      row.return_arrival
    )

  if (routesToInsert.length > 0) {
    const { error } = await supabase.from('mission_routes').insert(routesToInsert)
    if (error) throw new Error(error.message)
  }

  // 3) upsert mission parameters
  const parameterPayload = {
    mission_id: missionId,
    forfait: String(formData.get('forfait') || '') || null,
    hourly_option: String(formData.get('hourly_option') || '') || null,
    type_service: String(formData.get('parameter_type_service') || '') || null,
    children_range: String(formData.get('children_range') || '') || null,
    participant_profile: String(formData.get('participant_profile') || '') || null,
    client_type: String(formData.get('client_type') || '') || null,
    client_profile: String(formData.get('client_profile') || '') || null,
    dossier_number: String(formData.get('dossier_number') || '') || null,
    designation: String(formData.get('designation') || '') || null,
    client_name: String(formData.get('client_name') || '') || null,
    client_address: String(formData.get('client_address') || '') || null,
    client_city: String(formData.get('client_city') || '') || null,
    mission_reason: String(formData.get('mission_reason') || '') || null,
    updated_at: new Date().toISOString(),
  }

  const existingParameters = await supabase
    .from('mission_parameters')
    .select('id')
    .eq('mission_id', missionId)
    .maybeSingle()

  if (existingParameters.data?.id) {
    const { error } = await supabase
      .from('mission_parameters')
      .update(parameterPayload)
      .eq('mission_id', missionId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('mission_parameters')
      .insert([{ ...parameterPayload, created_at: new Date().toISOString() }])
    if (error) throw new Error(error.message)
  }

  // 4) replace parameter days
  await supabase.from('mission_parameter_days').delete().eq('mission_id', missionId)

  const paramDates = formData.getAll('param_session_date').map(String)
  const paramTimes = formData.getAll('param_session_time').map(String)
  const paramModules = formData.getAll('param_module_theme').map(String)

  const parameterDaysToInsert = paramDates
    .map((value, index) => ({
      mission_id: missionId,
      line_order: index,
      session_date: value || null,
      session_time: paramTimes[index] || null,
      module_theme: paramModules[index] || null,
    }))
    .filter((row) => row.session_date || row.session_time || row.module_theme)

  if (parameterDaysToInsert.length > 0) {
    const { error } = await supabase.from('mission_parameter_days').insert(parameterDaysToInsert)
    if (error) throw new Error(error.message)
  }

  // 5) upsert transport
  const transportPayload = {
    mission_id: missionId,
    transport_by: String(formData.get('transport_by') || '') || null,
    train: toBool(formData.get('transport_train')),
    airplane: toBool(formData.get('transport_airplane')),
    taxi: toBool(formData.get('transport_taxi')),
    private_driver: toBool(formData.get('transport_private_driver')),
    bus: toBool(formData.get('transport_bus')),
    taxi_info: String(formData.get('taxi_info') || '') || null,
    train_info: String(formData.get('train_info') || '') || null,
    ticket_to_order: toBool(formData.get('ticket_to_order')),
    ticket_to_reimburse: toBool(formData.get('ticket_to_reimburse')),
    updated_at: new Date().toISOString(),
  }

  const existingTransport = await supabase
    .from('mission_transport')
    .select('id')
    .eq('mission_id', missionId)
    .maybeSingle()

  if (existingTransport.data?.id) {
    const { error } = await supabase
      .from('mission_transport')
      .update(transportPayload)
      .eq('mission_id', missionId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('mission_transport')
      .insert([{ ...transportPayload, created_at: new Date().toISOString() }])
    if (error) throw new Error(error.message)
  }

  // 6) upsert allowances
  const allowancePayload = {
    mission_id: missionId,
    direct_collection: toBool(formData.get('direct_collection')),
    monthly_collection: toBool(formData.get('monthly_collection')),
    hourly_fee: toBool(formData.get('hourly_fee')),
    per_mission: toBool(formData.get('per_mission')),
    grade_fee: String(formData.get('grade_fee') || '') || null,
    meal_allowance: toBool(formData.get('meal_allowance')),
    lodging_reimbursed: toBool(formData.get('lodging_reimbursed')),
    lodging_not_reimbursed: toBool(formData.get('lodging_not_reimbursed')),
    manual_notes: String(formData.get('allowance_manual_notes') || '') || null,
    updated_at: new Date().toISOString(),
  }

  const existingAllowances = await supabase
    .from('mission_allowances')
    .select('id')
    .eq('mission_id', missionId)
    .maybeSingle()

  if (existingAllowances.data?.id) {
    const { error } = await supabase
      .from('mission_allowances')
      .update(allowancePayload)
      .eq('mission_id', missionId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('mission_allowances')
      .insert([{ ...allowancePayload, created_at: new Date().toISOString() }])
    if (error) throw new Error(error.message)
  }

  // 7) replace program lines
  await supabase.from('mission_program_lines').delete().eq('mission_id', missionId)

  const programSessionLabel = formData.getAll('program_session_label').map(String)
  const programDatetime = formData.getAll('program_session_datetime').map(String)
  const programTheme = formData.getAll('program_theme_module').map(String)
  const programCt = formData.getAll('program_ct').map(String)
  const programM1 = formData.getAll('program_m1').map(String)
  const programM2 = formData.getAll('program_m2').map(String)
  const programM3 = formData.getAll('program_m3').map(String)
  const programShortBreak = formData.getAll('program_short_break').map(String)
  const programMealBreak = formData.getAll('program_meal_break').map(String)
  const programCode = formData.getAll('program_code_atelier').map(String)
  const programNotes = formData.getAll('program_notes').map(String)

  const programLinesToInsert = programSessionLabel
    .map((value, index) => ({
      mission_id: missionId,
      line_order: index,
      session_label: value || null,
      session_datetime_label: programDatetime[index] || null,
      theme_module: programTheme[index] || null,
      ct_label: programCt[index] || null,
      m1: programM1[index] || null,
      m2: programM2[index] || null,
      m3: programM3[index] || null,
      short_break: programShortBreak[index] || null,
      meal_break: programMealBreak[index] || null,
      code_atelier: programCode[index] || null,
      notes: programNotes[index] || null,
    }))
    .filter((row) =>
      row.session_label ||
      row.session_datetime_label ||
      row.theme_module ||
      row.ct_label ||
      row.m1 ||
      row.m2 ||
      row.m3 ||
      row.short_break ||
      row.meal_break ||
      row.code_atelier ||
      row.notes
    )

  if (programLinesToInsert.length > 0) {
    const { error } = await supabase.from('mission_program_lines').insert(programLinesToInsert)
    if (error) throw new Error(error.message)
  }

  redirect(`/missions/${missionId}`)
}