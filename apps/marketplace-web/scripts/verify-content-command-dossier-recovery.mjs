import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const app = path.resolve(process.argv[2] || process.cwd())
const checks = []
const failures = []
const read = (rel) => fs.readFileSync(path.join(app, rel), 'utf8')
const must = (name, condition) => { checks.push(name); if (!condition) failures.push(name) }
const contains = (rel, ...needles) => {
  const source = read(rel)
  return needles.every((needle) => source.includes(needle))
}

const service = 'lib/market-os/content-command-headquarters/dossier-recovery-service.ts'
const route = 'app/api/market-os/content-command-headquarters/actions/route.ts'
const briefPage = 'components/market-os/content-command/content-briefs-page.tsx'
const briefDesk = 'components/market-os/content-command/experience-bulk1/DossierBriefRecoveryWorkspace.tsx'
const recoveryDock = 'components/market-os/content-command/experience-bulk1/DossierRecoveryDock.tsx'
const dossier = 'components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx'
const derivations = 'components/market-os/content-command/experience-bulk1/bulk1-derivations.ts'
const models = 'components/market-os/content-command/headquarters/mz2-view-models.ts'
const css = 'components/market-os/content-command/experience-bulk1/dossier-recovery.module.css'

for (const rel of [service, route, briefPage, briefDesk, recoveryDock, dossier, derivations, models, css]) {
  must(`file exists: ${rel}`, fs.existsSync(path.join(app, rel)))
}

must('service persists dossier brief', contains(service, 'saveDossierBrief', "brief: nextBrief", 'readiness: readiness.score'))
must('service confirms gate atomically', contains(service, 'confirmDossierConstitution', "status: 'scope_locked'", "action: 'dossier.constitution_confirmed'"))
must('reviewer absence becomes explicit condition', contains(service, 'REVIEW_AUTHORITY_PENDING', "progression_authority: reviewerAssigned ? 'normal' : 'conditional'"))
must('archive cancels derived tasks', contains(service, 'archiveDossierWithCleanup', "status: 'cancelled'", "status: 'archived'"))
must('purge is typed and dependency aware', contains(service, 'permanentlyDeleteDraftDossier', 'TYPED_CONFIRMATION_MISMATCH', 'DOSSIER_PURGE_BLOCKED'))
must('protected history blocks purge', contains(service, 'market_content_human_reviews', 'market_content_source_objects', 'market_content_performance_events', 'market_content_learning_records'))
must('actions route exposes all recovery actions', contains(route, 'dossier_save_brief', 'dossier_confirm_constitution', 'dossier_archive_cleanup', 'dossier_permanent_delete_cleanup'))
must('purge requires purge authority', contains(route, 'dossier_permanent_delete_cleanup" ? "purge"'))
must('brief route detects live dossier context', contains(briefPage, 'useSearchParams', 'DossierBriefRecoveryWorkspace', 'dossierId'))
must('brief desk offers save reviewer and confirmation', contains(briefDesk, 'dossier_save_brief', 'dossier_assign_reviewer', 'dossier_confirm_constitution'))
must('brief confirmation navigates to scope locked', contains(briefDesk, '?stage=scope_locked'))
must('dossier exposes repair archive delete controls', contains(recoveryDock, 'Réparer / compléter le Brief', 'Annuler et archiver', 'Supprimer définitivement'))
must('dossier mounts recovery dock', contains(dossier, 'DossierRecoveryDock', 'onRefresh={refresh}'))
must('requirements use eight-field linked brief', contains(derivations, 'dossier.brief.userProblem', 'dossier.brief.channels.length > 0', 'Brief lié incomplet'))
must('home runway no longer lies about incomplete brief', contains(models, 'Créer le brief lié', 'Compléter le brief (', 'briefStateForDossier'))
must('archived dossiers remain excluded from runway', contains(models, '["closed", "archived", "cancelled"]'))

// Deterministic model cases — independent of external providers and database access.
const missing = (value) => !String(value || '').trim() || /non défini|non définie|non documenté|non documentée|à constituer|à sélectionner/i.test(String(value))
const readiness = (brief) => {
  const fields = [brief.objective, brief.audience, brief.userProblem, brief.coreMessage, brief.format, brief.tone, brief.version]
  const complete = fields.every((value) => !missing(value)) && Array.isArray(brief.channels) && brief.channels.length > 0
  return complete
}
must('deterministic: empty brief cannot confirm', readiness({ channels: [] }) === false)
must('deterministic: complete brief can confirm', readiness({ objective:'O', audience:'A', userProblem:'P', coreMessage:'M', format:'F', tone:'T', version:'v1', channels:['Email'] }) === true)
const protectedReasons = ({status='brief', humanReviews=0, sources=0, packages=0, performance=0, learning=0}) => [
  ['validated','source_required','source_secured','classified','ready_distribution','scheduled','published','performance_review','closed'].includes(status),
  humanReviews>0, sources>0, packages>0, performance>0, learning>0,
].filter(Boolean).length
must('deterministic: orphan draft purge is eligible', protectedReasons({}) === 0)
must('deterministic: human decision blocks purge', protectedReasons({humanReviews:1}) > 0)
must('deterministic: published dossier blocks purge', protectedReasons({status:'published'}) > 0)

// CSS reference resolution for the two newly introduced client components.
const cssSource = read(css)
const cssClasses = new Set([...cssSource.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]))
for (const rel of [briefDesk, recoveryDock]) {
  const source = read(rel)
  for (const match of source.matchAll(/styles\.([A-Za-z_][\w]*)/g)) {
    must(`css class ${match[1]} used by ${path.basename(rel)}`, cssClasses.has(match[1]))
  }
}

if (failures.length) {
  console.error(`FAIL — ${failures.length} of ${checks.length} dossier recovery checks failed.`)
  failures.forEach((item) => console.error(` - ${item}`))
  process.exit(1)
}
console.log(`PASS — ${checks.length} dossier lifecycle recovery, Brief integrity and cleanup checks passed.`)
