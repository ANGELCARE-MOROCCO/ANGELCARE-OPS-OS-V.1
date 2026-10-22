/** Blueprint p17: the 16 canonical settings retain their approved order. */
export const SETTINGS = [
  ['households', 'Private households & domestic care'],
  ['nurseries', 'Nurseries & daycare'],
  ['preschool', 'Kindergarten & preschool'],
  ['primary-schools', 'Primary schools'],
  ['secondary-colleges', 'Secondary schools & colleges'],
  ['international-schools', 'International & private schools'],
  ['public-education', 'Public education'],
  ['pediatrics', 'Pediatric clinics & hospitals'],
  ['maternity-neonatal', 'Maternity & neonatal settings'],
  ['therapy-development', 'Therapy & developmental centers'],
  ['hospitality', 'Hotels, resorts & kids clubs'],
  ['camps-sports', 'Camps, sports & recreation'],
  ['ngo-child-welfare', 'NGOs, charities & child welfare'],
  ['school-operations', 'School transport, food & operations'],
  ['digital-learning', 'Digital learning & child content'],
  ['public-specialist', 'Public agencies & specialist institutions'],
] as const;
export type SettingId = typeof SETTINGS[number][0];
export const ARRANGEMENTS = ['full_time', 'part_time', 'permanent', 'fixed_term', 'temporary', 'seasonal', 'internship', 'live_in', 'remote', 'hybrid'] as const;
export const AGE_COHORTS = ['newborn', 'infant', 'toddler', 'preschool', 'primary', 'adolescent', 'multi_age', 'non_contact'] as const;
export const OCCUPATIONS = [
  ['nanny', ['childminder', 'nounou', 'niñera']],
  ['family-assistant', ['family support', 'assistant familial']],
  ['early-childhood-educator', ['nursery practitioner', 'éducateur', 'educadora']],
  ['montessori-guide', ['montessori teacher']],
  ['teacher', ['enseignant', 'professeur', 'maestro']],
  ['teaching-assistant', ['classroom assistant', 'assistant pédagogique']],
  ['nurse', ['registered nurse', 'infirmier', 'infirmière', 'enfermero']],
  ['pediatrician', ['paediatrician', 'pédiatre', 'pediatra']],
  ['therapy-specialist', ['therapist', 'speech therapist', 'occupational therapist']],
  ['school-administrator', ['school office', 'administrateur scolaire']],
  ['counselor', ['counsellor', 'conseiller']],
  ['driver', ['school bus driver', 'chauffeur']],
  ['cook', ['school catering', 'cuisinier']],
  ['activity-leader', ['camp counselor', 'animateur', 'sports coach']],
  ['learning-designer', ['educational content', 'edtech']],
  ['safeguarding-officer', ['child protection', 'protection de l’enfance']],
] as const;
export function settingExists(value: string): value is SettingId {
  return SETTINGS.some(([id]) => id === value);
}
