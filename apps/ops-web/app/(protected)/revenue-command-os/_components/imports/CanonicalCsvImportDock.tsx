'use client'

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  DatabaseZap,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  emitRevenueAction,
  managedRevenueHeaders,
  revenueActionId,
} from '../action-center/action-events'
import styles from './CanonicalCsvImportDock.module.css'

export type CanonicalImportKind = 'mandates' | 'commands' | 'doctrines' | 'gemini-resources'

type CsvRow = Record<string, string>
type ApiEnvelope<T> = { ok?: boolean; data?: T; error?: { message?: string } }
type ListItem = { code: string; title: string; subtitle?: string; status?: string; version?: string }

type KindConfig = {
  eyebrow: string
  title: string
  description: string
  launcher: string
  headers: string[]
  required: string[]
  example: CsvRow
  resultHref: string
}

const CONFIG: Record<CanonicalImportKind, KindConfig> = {
  mandates: {
    eyebrow: 'Mandate Intake Studio',
    title: 'Importer et lancer les mandats',
    description: 'Chargez un portefeuille de mandats Revenue OS, validez chaque ligne, puis lancez uniquement les dossiers autorisés.',
    launcher: 'Importer des mandats',
    headers: ['mandate_code','title','description','business_unit','market','segments','territories','named_accounts','revenue_target_dh','minimum_margin_percent','horizon_days','due_date','budget_limit_dh','capacity_constraints','approved_offers','approved_channels','risk_appetite','success_criteria','failure_conditions','authority_level','owner_email','priority','status','tags'],
    required: ['mandate_code','title','description','business_unit','market','horizon_days'],
    example: {
      mandate_code: 'REV-MANDATE-RABAT-001',
      title: 'Accélération B2B Rabat',
      description: 'Générer un pipeline qualifié auprès des établissements privés à Rabat.',
      business_unit: 'ANGELCARE Academy',
      market: 'Rabat',
      segments: 'Écoles privées|Crèches privées',
      territories: 'Rabat|Salé|Témara',
      named_accounts: 'Compte A|Compte B',
      revenue_target_dh: '250000',
      minimum_margin_percent: '35',
      horizon_days: '90',
      due_date: '2026-10-31',
      budget_limit_dh: '25000',
      capacity_constraints: 'Capacité Academy validée',
      approved_offers: 'Diagnostic 360|Programme Excellence',
      approved_channels: 'email_os|meetings|proposals',
      risk_appetite: 'balanced',
      success_criteria: '10 rendez-vous|4 propositions|2 signatures',
      failure_conditions: 'Aucune réunion qualifiée sous 30 jours',
      authority_level: 'Direction générale',
      owner_email: 'commercial@angelcare.ma',
      priority: 'high',
      status: 'draft',
      tags: 'rabat|b2b',
    },
    resultHref: '/revenue-command-os/revenue-objectives',
  },
  commands: {
    eyebrow: 'Command Kernel Intake',
    title: 'Importer et tester les commandes',
    description: 'Étendez le registre canonique sans contourner les familles, les permissions, les doctrines ni les classes d’approbation.',
    launcher: 'Importer des commandes',
    headers: ['command_code','name','family_code','purpose','owner_role','status','active_version','business_units','segments','territories','commercial_stages','trigger_types','eligibility_rules','required_context','optional_context','required_resources','required_doctrines','tool_permissions','input_schema','output_schema','validator_chain','approval_class','downstream_compiler','cooldown_policy','retry_policy','failure_policy','fallback_command_codes','performance_metrics','prohibited_cases','expected_outcomes','tags'],
    required: ['command_code','name','family_code','purpose','owner_role','active_version'],
    example: {
      command_code: 'REV-CMD-3001',
      name: 'Qualifier le potentiel de compte',
      family_code: 'ACCOUNT-INTELLIGENCE',
      purpose: 'Évaluer un compte cible avant engagement commercial.',
      owner_role: 'Revenue Manager',
      status: 'draft',
      active_version: '1.0.0',
      business_units: 'ANGELCARE',
      segments: 'Écoles privées',
      territories: 'Rabat',
      commercial_stages: 'qualification',
      trigger_types: 'manual|signal',
      eligibility_rules: '[{"field":"account.status","operator":"neq","value":"blocked"}]',
      required_context: 'account|signal|offerCatalogue',
      optional_context: 'lastInteraction|capacity',
      required_resources: 'RES-GEMINI-STRATEGY',
      required_doctrines: 'REV-DOC-001',
      tool_permissions: '[{"tool":"internal_context","access":"read"}]',
      input_schema: '{"type":"object"}',
      output_schema: '{"type":"object"}',
      validator_chain: 'schema|doctrine|authority',
      approval_class: 'recommendation',
      downstream_compiler: 'mission-compiler',
      cooldown_policy: '{"seconds":0}',
      retry_policy: '{"maxAttempts":1}',
      failure_policy: '{"mode":"stop"}',
      fallback_command_codes: '',
      performance_metrics: 'precision|conversion',
      prohibited_cases: 'external_send_without_approval',
      expected_outcomes: 'qualified_account',
      tags: 'imported|account',
    },
    resultHref: '/revenue-command-os/command-kernel',
  },
  doctrines: {
    eyebrow: 'Institutional Doctrine Intake',
    title: 'Importer et évaluer les doctrines',
    description: 'Les doctrines importées deviennent des brouillons gouvernés; elles n’acquièrent jamais d’autorité sans preuve et approbation.',
    launcher: 'Importer des doctrines',
    headers: ['doctrine_code','title','domain','category','statement','rationale','authority_role','department','business_units','evidence_requirements','applicable_command_families','applicable_segments','applicable_offers','prohibited_actions','required_approvals','conflict_codes','review_cycle_days','effective_from','effective_until','confidentiality','status','version','tags'],
    required: ['doctrine_code','title','category','statement','authority_role'],
    example: {
      doctrine_code: 'REV-DOC-IMPORT-001',
      title: 'Doctrine de qualification B2B',
      domain: 'commercial',
      category: 'qualification',
      statement: 'Aucune opportunité ne progresse sans décideur identifié et besoin confirmé.',
      rationale: 'Protéger la qualité du pipeline et le temps commercial.',
      authority_role: 'Chief Revenue Officer',
      department: 'Revenue',
      business_units: 'ANGELCARE',
      evidence_requirements: 'Décideur|Besoin|Horizon',
      applicable_command_families: 'ACCOUNT-INTELLIGENCE',
      applicable_segments: 'Écoles privées',
      applicable_offers: '',
      prohibited_actions: 'proposal_without_qualification',
      required_approvals: 'Revenue Director',
      conflict_codes: '',
      review_cycle_days: '90',
      effective_from: '',
      effective_until: '',
      confidentiality: 'internal',
      status: 'draft',
      version: '1.0',
      tags: 'qualification|b2b',
    },
    resultHref: '/revenue-command-os/memory-learning/doctrine-library',
  },
  'gemini-resources': {
    eyebrow: 'Gemini Resource Registry',
    title: 'Importer et exécuter les ressources Gemini',
    description: 'Enregistrez des prompts, modèles, context adapters, cadres analytiques et schémas de sortie sans jamais importer de secret.',
    launcher: 'Importer des ressources',
    headers: ['resource_code','name','resource_type','description','domain','provider','model_name','prompt_version','content_reference','context_adapter','tool_name','input_schema','output_schema','permission_key','approval_class','timeout_seconds','max_tokens','temperature','enabled','status','version','tags'],
    required: ['resource_code','name','resource_type','description','version'],
    example: {
      resource_code: 'RES-GEMINI-STRATEGY',
      name: 'Strategic Assembly Framework',
      resource_type: 'analytical_framework',
      description: 'Cadre de génération et comparaison de stratégies Revenue OS.',
      domain: 'strategy',
      provider: 'gemini',
      model_name: 'configured-primary',
      prompt_version: '1.0',
      content_reference: 'registry://strategy-assembly',
      context_adapter: 'revenue_context',
      tool_name: '',
      input_schema: '{"type":"object"}',
      output_schema: '{"type":"object"}',
      permission_key: 'revenue_os.strategy.manage',
      approval_class: 'director',
      timeout_seconds: '240',
      max_tokens: '12000',
      temperature: '0.2',
      enabled: 'true',
      status: 'draft',
      version: '1.0',
      tags: 'strategy|gemini',
    },
    resultHref: '/revenue-command-os/gemini-resources',
  },
}

export default function CanonicalCsvImportDock({ kind }: { kind: CanonicalImportKind }) {
  const config = CONFIG[kind]
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'import' | 'run'>('import')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<CsvRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [validation, setValidation] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState('')
  const [items, setItems] = useState<ListItem[]>([])
  const [mandates, setMandates] = useState<ListItem[]>([])
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [mandateCode, setMandateCode] = useState('')
  const [targetType, setTargetType] = useState<'mandate' | 'command'>('mandate')
  const [targetCode, setTargetCode] = useState('')
  const [runContext, setRunContext] = useState({
    businessUnit: 'ANGELCARE',
    segment: 'Écoles privées',
    territory: 'Rabat',
    commercialStage: 'qualification',
    signalType: 'manual.canonical.run',
    opportunityValueDh: '0',
  })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open || tab !== 'run') return
    void loadRunOptions()
  }, [open, tab, kind])

  async function loadRunOptions() {
    try {
      const [own, objectiveList] = await Promise.all([
        fetch(`/api/revenue-command-os/canonical-operations?kind=${encodeURIComponent(kind)}`, { cache: 'no-store' }).then((response) => response.json()),
        kind === 'mandates'
          ? Promise.resolve(null)
          : fetch('/api/revenue-command-os/canonical-operations?kind=mandates', { cache: 'no-store' }).then((response) => response.json()),
      ])
      setItems(Array.isArray(own?.data?.items) ? own.data.items : [])
      setMandates(kind === 'mandates' ? (Array.isArray(own?.data?.items) ? own.data.items : []) : (Array.isArray(objectiveList?.data?.items) ? objectiveList.data.items : []))
    } catch {
      setItems([])
      setMandates([])
    }
  }

  function close() {
    if (busy) return
    setOpen(false)
  }

  function onFile(file?: File) {
    if (!file) return
    setFileName(file.name)
    setValidation(null)
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result || ''))
      setRows(parsed.rows)
      const missing = config.required.filter((header) => !parsed.headers.includes(header))
      setParseErrors([...parsed.errors, ...missing.map((header) => `Colonne obligatoire absente: ${header}`)])
    }
    reader.readAsText(file, 'utf-8')
  }

  async function validateRows() {
    if (!rows.length || parseErrors.length) return
    const actionId = revenueActionId(`validate-${kind}`)
    setBusy('validate')
    emitRevenueAction({
      id: actionId,
      title: `Validation ${config.title.toLowerCase()}`,
      workspace: config.eyebrow,
      state: 'validating',
      step: `Contrôle de ${rows.length} ligne(s), dépendances et doublons`,
      progress: 18,
      totalItems: rows.length,
      completedItems: 0,
      dismissible: false,
    })
    try {
      const envelope = await postCanonical({ action: 'validate', kind, rows })
      setValidation(envelope.data)
      const rejected = Number(envelope.data?.summary?.rejected || 0)
      emitRevenueAction({
        id: actionId,
        title: `Validation ${config.title.toLowerCase()}`,
        workspace: config.eyebrow,
        state: rejected ? 'partial' : 'success',
        step: rejected ? 'Validation terminée avec lignes à corriger' : 'Toutes les lignes sont prêtes à être importées',
        progress: 100,
        totalItems: rows.length,
        completedItems: rows.length - rejected,
        warningCount: rejected,
        completedAt: new Date().toISOString(),
        detail: summaryText(envelope.data?.summary),
        reportName: `validation-${kind}-${Date.now()}.json`,
        dismissible: true,
      })
    } catch (error) {
      emitRevenueAction({
        id: actionId,
        title: `Validation ${config.title.toLowerCase()}`,
        workspace: config.eyebrow,
        state: 'failure',
        step: 'Validation interrompue',
        progress: 100,
        completedAt: new Date().toISOString(),
        error: messageOf(error),
        dismissible: true,
      })
      setValidation({ error: messageOf(error) })
    } finally {
      setBusy('')
    }
  }

  async function importRows() {
    if (!rows.length || parseErrors.length) return
    const actionId = revenueActionId(`import-${kind}`)
    setBusy('import')
    emitRevenueAction({
      id: actionId,
      title: config.launcher,
      workspace: config.eyebrow,
      state: 'running',
      step: 'Écriture idempotente dans le registre canonique',
      progress: 42,
      totalItems: rows.length,
      completedItems: 0,
      dismissible: false,
    })
    try {
      const envelope = await postCanonical({ action: 'import', kind, rows })
      setResult(envelope.data)
      const summary = envelope.data?.summary || {}
      const rejected = Number(summary.rejected || 0)
      const completed = Number(summary.created || 0) + Number(summary.updated || 0) + Number(summary.skipped || 0)
      emitRevenueAction({
        id: actionId,
        title: config.launcher,
        workspace: config.eyebrow,
        state: rejected ? 'partial' : 'success',
        step: rejected ? 'Import achevé avec réserves' : 'Import achevé et audit enregistré',
        progress: 100,
        totalItems: rows.length,
        completedItems: completed,
        warningCount: rejected,
        completedAt: new Date().toISOString(),
        detail: summaryText(summary),
        resultHref: config.resultHref,
        auditHref: '/revenue-command-os/audit',
        reportName: `import-${kind}-${Date.now()}.json`,
        dismissible: true,
      })
      await loadRunOptions()
    } catch (error) {
      setResult({ error: messageOf(error) })
      emitRevenueAction({
        id: actionId,
        title: config.launcher,
        workspace: config.eyebrow,
        state: 'failure',
        step: 'Import interrompu sans masquer les lignes en erreur',
        progress: 100,
        totalItems: rows.length,
        completedItems: 0,
        completedAt: new Date().toISOString(),
        error: messageOf(error),
        auditHref: '/revenue-command-os/audit',
        dismissible: true,
      })
    } finally {
      setBusy('')
    }
  }

  async function runSelected() {
    const codes = kind === 'gemini-resources' ? selectedCodes : selectedCodes.slice(0, 1)
    if (!codes.length) return
    if ((kind === 'mandates' || kind === 'gemini-resources') && !mandateCode) return
    if (kind === 'doctrines' && !targetCode) return

    const actionId = revenueActionId(`run-${kind}`)
    setBusy('run')
    emitRevenueAction({
      id: actionId,
      title: `Run gouverné · ${config.eyebrow}`,
      workspace: config.eyebrow,
      state: 'running',
      step: kind === 'gemini-resources' || kind === 'mandates' ? 'Assemblage du contexte et appel Gemini' : kind === 'commands' ? 'Simulation Shadow du noyau de commandes' : 'Évaluation doctrinale',
      indeterminate: true,
      totalItems: codes.length,
      completedItems: 0,
      dismissible: false,
    })
    try {
      const envelope = await postCanonical({
        action: 'run',
        kind,
        codes,
        mandateCode,
        targetType,
        targetCode,
        context: runContext,
      })
      setResult(envelope.data)
      emitRevenueAction({
        id: actionId,
        title: `Run gouverné · ${config.eyebrow}`,
        workspace: config.eyebrow,
        state: 'success',
        step: 'Run terminé, résultat persisté ou audité',
        progress: 100,
        indeterminate: false,
        totalItems: codes.length,
        completedItems: codes.length,
        completedAt: new Date().toISOString(),
        detail: messageFromResult(envelope.data),
        resultHref: runResultHref(kind, envelope.data),
        auditHref: '/revenue-command-os/audit',
        reportName: `run-${kind}-${Date.now()}.json`,
        dismissible: true,
      })
    } catch (error) {
      setResult({ error: messageOf(error) })
      emitRevenueAction({
        id: actionId,
        title: `Run gouverné · ${config.eyebrow}`,
        workspace: config.eyebrow,
        state: 'failure',
        step: 'Run interrompu par validation, permission ou runtime',
        progress: 100,
        indeterminate: false,
        completedAt: new Date().toISOString(),
        error: messageOf(error),
        auditHref: '/revenue-command-os/audit',
        dismissible: true,
      })
    } finally {
      setBusy('')
    }
  }

  const previewHeaders = useMemo(() => rows.length ? Object.keys(rows[0]).slice(0, 9) : config.headers.slice(0, 9), [rows, config.headers])
  const canImport = rows.length > 0 && !parseErrors.length && !busy
  const canRun = selectedCodes.length > 0 && !busy
    && (kind !== 'mandates' && kind !== 'gemini-resources' || Boolean(mandateCode))
    && (kind !== 'doctrines' || Boolean(targetCode))

  const drawer = open ? (
    <>
      <button className={styles.overlay} onClick={close} aria-label="Fermer le studio d’import" />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label={config.title}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.headerIcon}>{kind === 'gemini-resources' ? <Bot size={20} /> : <DatabaseZap size={20} />}</span>
            <div className={styles.headerCopy}>
              <p className={styles.eyebrow}>{config.eyebrow}</p>
              <h2 className={styles.title}>{config.title}</h2>
              <p className={styles.description}>{config.description}</p>
            </div>
            <button type="button" className={styles.close} onClick={close} aria-label="Fermer"><X size={18} /></button>
          </div>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'import' ? styles.tabActive : ''}`} onClick={() => setTab('import')}>Importer & valider</button>
            <button className={`${styles.tab} ${tab === 'run' ? styles.tabActive : ''}`} onClick={() => setTab('run')}>Exécuter & observer</button>
          </div>
        </header>

        <div className={styles.body}>
          {tab === 'import' ? (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div><h3>Fichier CSV canonique</h3><p>Téléchargez le modèle officiel. Les en-têtes sont stables et les champs multiples utilisent le séparateur <strong>|</strong>.</p></div>
                  <button type="button" className={styles.secondary} onClick={() => downloadTemplate(kind)}><Download size={14} /> Modèle CSV</button>
                </div>
                <label className={styles.dropzone}>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(event) => onFile(event.target.files?.[0])} />
                  <span>
                    <span className={styles.dropIcon}><UploadCloud size={19} /></span>
                    <strong>{fileName || 'Déposer ou sélectionner un fichier CSV'}</strong>
                    <span>UTF-8 · jusqu’à 1 000 lignes par lot · aucune clé secrète autorisée</span>
                  </span>
                </label>
                <div className={styles.fileMeta}>
                  <span className={styles.pill}>{rows.length} ligne(s)</span>
                  <span className={styles.pill}>{config.headers.length} colonnes canoniques</span>
                  {parseErrors.length ? <span className={`${styles.pill} ${styles.pillError}`}>{parseErrors.length} erreur(s)</span> : <span className={styles.pill}>Structure lisible</span>}
                </div>
                {parseErrors.length ? <div className={`${styles.validation} ${styles.validationBad}`}><strong>Le fichier doit être corrigé avant import.</strong><ul>{parseErrors.slice(0, 12).map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
              </section>

              {rows.length ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}><div><h3>Aperçu des données</h3><p>Les vingt premières lignes sont affichées. La validation serveur contrôle ensuite chaque enregistrement.</p></div></div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr>{previewHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                      <tbody>{rows.slice(0, 20).map((row, index) => <tr key={index}>{previewHeaders.map((header) => <td key={header} title={row[header]}>{row[header] || '—'}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {validation ? (
                <section className={styles.section}>
                  <div className={`${styles.validation} ${validation.error || validation.summary?.rejected ? styles.validationBad : styles.validationOk}`}>
                    <strong>{validation.error ? 'Validation indisponible' : validation.summary?.rejected ? 'Certaines lignes exigent une correction' : 'Validation canonique réussie'}</strong>
                    {validation.error ? <p>{validation.error}</p> : <ul><li>{summaryText(validation.summary)}</li>{(validation.issues || []).slice(0, 12).map((issue: any) => <li key={`${issue.row}-${issue.message}`}>Ligne {issue.row}: {issue.message}</li>)}</ul>}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <RunPanel
              kind={kind}
              items={items}
              mandates={mandates}
              selectedCodes={selectedCodes}
              setSelectedCodes={setSelectedCodes}
              mandateCode={mandateCode}
              setMandateCode={setMandateCode}
              targetType={targetType}
              setTargetType={setTargetType}
              targetCode={targetCode}
              setTargetCode={setTargetCode}
              runContext={runContext}
              setRunContext={setRunContext}
              reload={loadRunOptions}
            />
          )}

          {result ? <section className={styles.result}><h4>Résultat de l’opération</h4><pre>{JSON.stringify(result, null, 2)}</pre></section> : null}
        </div>

        <footer className={styles.footer}>
          <p className={styles.footerNote}>Toutes les mutations sont permissionnées, idempotentes et auditées. Les effets externes restent sur approbation.</p>
          <div className={styles.footerActions}>
            {tab === 'import' ? (
              <>
                <button type="button" className={styles.secondary} disabled={!canImport} onClick={validateRows}>{busy === 'validate' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Valider</button>
                <button type="button" className={styles.primary} disabled={!canImport} onClick={importRows}>{busy === 'import' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Importer</button>
              </>
            ) : <button type="button" className={styles.primary} disabled={!canRun} onClick={runSelected}>{busy === 'run' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Lancer le run</button>}
          </div>
        </footer>
      </aside>
    </>
  ) : null

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}><FileSpreadsheet size={15} /> {config.launcher}</button>
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  )
}

function RunPanel(props: {
  kind: CanonicalImportKind
  items: ListItem[]
  mandates: ListItem[]
  selectedCodes: string[]
  setSelectedCodes: (value: string[]) => void
  mandateCode: string
  setMandateCode: (value: string) => void
  targetType: 'mandate' | 'command'
  setTargetType: (value: 'mandate' | 'command') => void
  targetCode: string
  setTargetCode: (value: string) => void
  runContext: Record<string, string>
  setRunContext: (value: any) => void
  reload: () => void
}) {
  const { kind, items, mandates, selectedCodes, setSelectedCodes } = props
  const multi = kind === 'gemini-resources'
  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div><h3>Sélection gouvernée</h3><p>{multi ? 'Plusieurs ressources peuvent enrichir le même contexte.' : 'Sélectionnez un objet canonique à tester ou exécuter.'}</p></div>
          <button type="button" className={styles.secondary} onClick={props.reload}><RefreshCw size={13} /> Actualiser</button>
        </div>
        <div className={styles.checkList}>
          {items.map((item) => {
            const checked = selectedCodes.includes(item.code)
            return <label key={item.code} className={styles.check}><input type={multi ? 'checkbox' : 'radio'} name={`run-${kind}`} checked={checked} onChange={() => setSelectedCodes(multi ? checked ? selectedCodes.filter((code) => code !== item.code) : [...selectedCodes, item.code] : [item.code])} /><span><strong>{item.title}</strong><span>{item.code} · {item.status || 'statut inconnu'} {item.version ? `· v${item.version}` : ''}</span></span></label>
          })}
          {!items.length ? <div className={`${styles.validation} ${styles.validationBad}`}><strong>Aucun objet importé ou accessible.</strong><p>Importez un fichier canonique ou vérifiez les permissions et la source.</p></div> : null}
        </div>
      </section>

      {(kind === 'mandates' || kind === 'gemini-resources') ? (
        <section className={styles.section}>
          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.fieldFull}`}><span className={styles.label}>Mandat à assembler</span><select className={styles.select} value={props.mandateCode} onChange={(event) => props.setMandateCode(event.target.value)}><option value="">Sélectionner…</option>{mandates.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}</select></label>
          </div>
          <div className={`${styles.validation} ${styles.validationOk}`}><strong>Posture d’exécution</strong><p>Gemini assemble des stratégies et persiste un run traçable. Aucun message, paiement ou engagement externe n’est exécuté.</p></div>
        </section>
      ) : null}

      {kind === 'commands' ? (
        <section className={styles.section}>
          <div className={styles.grid}>
            {[
              ['businessUnit','Business unit'],
              ['segment','Segment'],
              ['territory','Territoire'],
              ['commercialStage','Étape commerciale'],
              ['signalType','Type de signal'],
              ['opportunityValueDh','Valeur opportunité (Dh)'],
            ].map(([key,label]) => <label key={key} className={styles.field}><span className={styles.label}>{label}</span><input className={styles.input} value={props.runContext[key]} onChange={(event) => props.setRunContext({ ...props.runContext, [key]: event.target.value })} /></label>)}
          </div>
          <div className={`${styles.validation} ${styles.validationOk}`}><strong>Mode Shadow</strong><p>Le noyau calcule l’éligibilité, le plan et les résultats sans exécuter d’effet commercial externe.</p></div>
        </section>
      ) : null}

      {kind === 'doctrines' ? (
        <section className={styles.section}>
          <div className={styles.grid}>
            <label className={styles.field}><span className={styles.label}>Objet évalué</span><select className={styles.select} value={props.targetType} onChange={(event) => props.setTargetType(event.target.value as 'mandate' | 'command')}><option value="mandate">Mandat</option><option value="command">Commande</option></select></label>
            <label className={styles.field}><span className={styles.label}>Code de l’objet</span><input className={styles.input} value={props.targetCode} onChange={(event) => props.setTargetCode(event.target.value)} placeholder="REV-MANDATE… ou REV-CMD…" /></label>
          </div>
          <div className={`${styles.validation} ${styles.validationOk}`}><strong>Évaluation doctrinale</strong><p>Le run calcule l’applicabilité, les règles, les interdictions et les approbations requises. Il n’active pas la doctrine.</p></div>
        </section>
      ) : null}
    </>
  )
}

async function postCanonical(payload: Record<string, unknown>) {
  const response = await fetch('/api/revenue-command-os/canonical-operations', {
    method: 'POST',
    headers: managedRevenueHeaders({ 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() }),
    body: JSON.stringify(payload),
  })
  const envelope = await response.json() as ApiEnvelope<any>
  if (!response.ok || envelope.ok === false) throw new Error(envelope.error?.message || `Erreur HTTP ${response.status}`)
  return envelope
}

function parseCsv(source: string): { headers: string[]; rows: CsvRow[]; errors: string[] } {
  const matrix: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const normalized = source.replace(/^\uFEFF/, '')
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]
    const next = normalized[index + 1]
    if (char === '"') {
      if (quoted && next === '"') { field += '"'; index += 1 } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field.trim()); field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field.trim()); field = ''
      if (row.some((value) => value !== '')) matrix.push(row)
      row = []
    } else {
      field += char
    }
  }
  row.push(field.trim())
  if (row.some((value) => value !== '')) matrix.push(row)
  if (!matrix.length) return { headers: [], rows: [], errors: ['Le fichier est vide.'] }
  const headers = matrix[0].map((value) => value.trim())
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index)
  const errors = duplicates.map((header) => `En-tête dupliqué: ${header}`)
  const rows = matrix.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
  return { headers, rows, errors }
}

function downloadTemplate(kind: CanonicalImportKind) {
  const config = CONFIG[kind]
  const csv = [config.headers, config.headers.map((header) => config.example[header] || '')]
    .map((row) => row.map(csvCell).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ANGELCARE_REVENUE_OS_${kind.toUpperCase().replaceAll('-', '_')}_TEMPLATE.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function summaryText(summary: any) {
  if (!summary) return 'Aucun résumé disponible.'
  return `${Number(summary.total || 0)} ligne(s) · ${Number(summary.created || 0)} créée(s) · ${Number(summary.updated || 0)} mise(s) à jour · ${Number(summary.skipped || 0)} ignorée(s) · ${Number(summary.rejected || 0)} rejetée(s)`
}

function messageFromResult(data: any) {
  if (data?.runId) return `Run ${String(data.runId).slice(0, 8)} terminé.`
  if (data?.evaluation?.status) return `Évaluation ${data.evaluation.status}.`
  if (data?.simulation?.posture) return `Simulation ${data.simulation.posture} terminée.`
  return 'Résultat disponible dans le registre et l’audit.'
}

function runResultHref(kind: CanonicalImportKind, data: any) {
  if (kind === 'mandates' || kind === 'gemini-resources') return data?.runId ? `/revenue-command-os/strategy-engine?run=${data.runId}` : '/revenue-command-os/strategy-engine'
  if (kind === 'commands') return '/revenue-command-os/command-kernel'
  return '/revenue-command-os/memory-learning/doctrine-library'
}
