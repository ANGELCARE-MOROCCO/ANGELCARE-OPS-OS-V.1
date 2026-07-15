export function buildDocumentReference(code: string, sequence: number, date = new Date()) {
  const year = date.getFullYear()
  const padded = String(sequence).padStart(6, '0')
  return `ACAD-${code}-${year}-${padded}`
}

export function normalizeCityCode(city?: string | null) {
  if (!city) return 'ALL'
  return city.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'ALL'
}

export function parseFilters(formData: FormData) {
  return {
    start: String(formData.get('start') || ''),
    end: String(formData.get('end') || ''),
    city: String(formData.get('city') || ''),
    service: String(formData.get('service') || ''),
    trainee_id: String(formData.get('trainee_id') || ''),
    trainer_id: String(formData.get('trainer_id') || ''),
    group_id: String(formData.get('group_id') || ''),
    course_id: String(formData.get('course_id') || ''),
    partner_id: String(formData.get('partner_id') || ''),
  }
}
