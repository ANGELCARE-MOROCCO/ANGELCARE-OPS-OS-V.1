import type { HRDashboardData } from './types'

export type HRQualityFinding = {
  key: string
  severity: 'low' | 'medium' | 'high'
  title: string
  source_table: string
  source_record_id?: string
  recommendation: string
}

export function scanHRDataQuality(data: HRDashboardData): HRQualityFinding[] {
  const findings: HRQualityFinding[] = []
  for (const s of data.staff as any[]) {
    if (!s.phone && !s.email) findings.push({ key:`staff-contact-${s.id}`, severity:'high', title:`Missing contact for ${s.full_name}`, source_table:'hr_staff', source_record_id:s.id, recommendation:'Add phone or email before assigning missions or payroll.' })
    if (!s.position) findings.push({ key:`staff-position-${s.id}`, severity:'medium', title:`Missing position for ${s.full_name}`, source_table:'hr_staff', source_record_id:s.id, recommendation:'Set department and position for role-based access and reporting.' })
    if (!s.contract_type) findings.push({ key:`staff-contract-${s.id}`, severity:'high', title:`Missing contract type for ${s.full_name}`, source_table:'hr_staff', source_record_id:s.id, recommendation:'Complete contract type before payroll preparation.' })
  }
  for (const d of data.docs as any[]) {
    if (['missing','expired','pending'].includes(String(d.status || 'missing'))) findings.push({ key:`doc-${d.id}`, severity:'high', title:`Document not compliant: ${d.title || d.document_type}`, source_table:'hr_staff_documents', source_record_id:d.id, recommendation:'Upload/validate document and set expiry date if needed.' })
  }
  for (const a of data.attendance as any[]) {
    if (String(a.validation_status || 'pending') === 'pending') findings.push({ key:`attendance-${a.id}`, severity:'medium', title:`Attendance pending validation: ${a.staff_name || a.staff_id}`, source_table:'hr_attendance', source_record_id:a.id, recommendation:'Approve, reject or request correction before payroll export.' })
  }
  for (const r of data.rosters as any[]) {
    if (String(r.conflict_status || 'clear') !== 'clear') findings.push({ key:`roster-${r.id}`, severity:'high', title:`Roster conflict: ${r.staff_name || r.staff_id}`, source_table:'hr_rosters', source_record_id:r.id, recommendation:'Resolve overlapping or uncovered shift before operations dispatch.' })
  }
  return findings
}
