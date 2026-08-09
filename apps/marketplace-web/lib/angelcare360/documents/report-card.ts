import { buildAngelcare360A4Reference } from './a4-reference'
import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'

type Row = Record<string, unknown>
function row(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function one(value: unknown): Row { return Array.isArray(value) ? row(value[0]) : row(value) }
function text(value: unknown, fallback = '—') { const output = value === null || value === undefined ? '' : String(value).trim(); return output || fallback }
function score(value: unknown) { const number = Number(value); return Number.isFinite(number) ? number.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—' }

export function buildStudentReportCardA4Model(input: { reportCard: unknown; lines: unknown[]; school?: unknown }): Angelcare360A4DocumentModel {
  const report = row(input.reportCard)
  const student = one(report.student)
  const classRecord = one(report.class)
  const section = one(report.section)
  const term = one(report.term)
  const academicYear = one(report.academic_year)
  const school = row(input.school)
  const lines = (input.lines || []).map(row)
  return {
    templateKey: 'customer-report-card-authoritative',
    title: 'Bulletin scolaire',
    family: 'Résultats académiques',
    owner: 'customer',
    referenceCode: buildAngelcare360A4Reference('BUL', text(report.report_card_code || report.id)),
    version: `v${text(row(report.metadata_json).document_version || 1)}`,
    issueDate: text(report.generated_on || new Date().toISOString().slice(0, 10)),
    confidentiality: 'confidential',
    preparedBy: 'AngelCare 360 · Autorité académique',
    clientName: text(student.full_name, 'Élève'),
    tenantName: text(school.name || school.school_code, 'Établissement'),
    schoolName: text(school.name || school.school_code, 'Établissement'),
    subject: `${text(term.label, 'Période')} · ${text(academicYear.label, '')}`,
    statusLabel: text(report.status, 'draft'),
    summaryLines: [
      `Élève: ${text(student.full_name)}`,
      `Classe: ${text(classRecord.name)}${section.name ? ` · ${text(section.name)}` : ''}`,
      `Période: ${text(term.label, 'Année scolaire')}`,
      `Moyenne générale: ${score(report.overall_average)} / 20`,
    ],
    metrics: [
      { label: 'Moyenne générale', value: `${score(report.overall_average)} / 20`, tone: 'primary' },
      { label: 'Rang', value: report.rank_position ? text(report.rank_position) : '—', tone: 'neutral' },
      { label: 'Matières', value: text(lines.length), tone: 'neutral' },
      { label: 'État', value: text(report.status), tone: report.status === 'published' ? 'success' : 'warning' },
    ],
    sections: [
      { title: 'Synthèse de présence', lines: [text(report.attendance_summary, 'Aucune synthèse de présence fournie.')] },
      { title: 'Traçabilité', lines: [
        `Code bulletin: ${text(report.report_card_code)}`,
        `Révision source: ${text(row(report.metadata_json).source_signature, 'Non renseignée')}`,
        `Généré le: ${text(report.generated_on)}`,
      ] },
    ],
    table: {
      headers: ['Matière', 'Moyenne', 'Coefficient', 'Appréciation'],
      rows: lines.map((line) => {
        const subject = one(line.subject)
        const comment = one(line.teacher_comment)
        return [
          text(subject.name || subject.subject_code),
          `${score(line.mark_average)} / 20`,
          score(line.coefficient),
          text(line.remarks || comment.comment_text, '—'),
        ]
      }),
    },
    note: 'Document généré depuis les notes, moyennes, validations et versions académiques autoritaires du tenant.',
    footerNote: 'ANGELCARE SANILA OS · Document institutionnel versionné et auditable.',
    signatureLabel: 'Validation académique',
    signatureName: text(row(report.metadata_json).validation_authority, 'Direction académique'),
  }
}
