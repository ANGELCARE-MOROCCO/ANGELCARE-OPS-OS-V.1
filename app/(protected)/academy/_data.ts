import { createClient } from '@/lib/supabase/server'

export async function getAcademyData() {
  const supabase = await createClient()
  const [trainees, courses, trainers, locations, groups, enrollments, payments, attendance, certificates, partners, alerts, graduation, audit] = await Promise.all([
    supabase.from('academy_trainees').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_courses').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_trainers').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_locations').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_groups').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_enrollments').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_payments').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_attendance').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_certificates').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_partners').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_alerts').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_graduation_followups').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('academy_audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
  ])
  return {
    trainees: trainees.data || [], courses: courses.data || [], trainers: trainers.data || [], locations: locations.data || [], groups: groups.data || [], enrollments: enrollments.data || [], payments: payments.data || [], attendance: attendance.data || [], certificates: certificates.data || [], partners: partners.data || [], alerts: alerts.data || [], graduation_followups: graduation.data || [], audit: audit.data || [],
    errors: [trainees.error, courses.error, trainers.error, locations.error, groups.error, enrollments.error, payments.error, attendance.error, certificates.error, partners.error, alerts.error, graduation.error, audit.error].filter(Boolean)
  }
}

export function nameOf(list: any[], id?: string | null, fallback = '—') {
  return list.find((x) => x.id === id)?.full_name || list.find((x) => x.id === id)?.title || list.find((x) => x.id === id)?.name || fallback
}
