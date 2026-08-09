import { createServiceClient } from '@/lib/supabase/server'
import { auditContentHeadquarters } from './repository'
import type { JsonRecord } from './types'
import { ContentCommandActionError } from './runtime-errors'

export type RecordLifecycleAction =
  | 'edit' | 'cancel' | 'suspend' | 'archive' | 'soft_delete' | 'restore' | 'reopen'
  | 'supersede' | 'cascade_archive' | 'permanent_delete'

export type RecordLifecycleEntityType =
  | 'signal' | 'strategy' | 'action_plan' | 'dossier' | 'mission' | 'task'
  | 'checkpoint' | 'evidence' | 'human_review' | 'ai_review' | 'source_object'
  | 'generated_sample' | 'publication_package' | 'asset' | 'approval'
  | 'performance_event' | 'learning_record' | 'ai_director' | 'source_replacement'
  | 'deliverable' | 'publication_record' | 'content_ai_run'
  | 'ai_command' | 'ai_skill' | 'ai_schedule' | 'ai_mission' | 'ai_compilation'
  | 'compilation_item' | 'ai_execution_job' | 'tool_execution' | 'dead_letter'
  | 'ai_decision' | 'ai_doctrine' | 'ai_learning'

export type RecordDependency = {
  entityType: string
  label: string
  table: string
  count: number
  activeCount: number
  blocking: boolean
  examples: Array<{ id: string; label: string; status: string; href?: string }>
}

export type CascadeDisposition = 'delete' | 'detach' | 'archive'

export type RecordCascadeRelation = {
  parentKey: string
  parentEntityType: RecordLifecycleEntityType
  parentEntityId: string
  childTable: string
  field: string
  match: 'eq' | 'contains' | 'nullable_eq'
  parentValue: string
  label: string
}

export type RecordCascadeNode = {
  key: string
  entityType: RecordLifecycleEntityType
  entityId: string
  label: string
  code: string
  status: string
  family: string
  table: string
  depth: number
  active: boolean
  protected: boolean
  availableDispositions: CascadeDisposition[]
  recommendedDisposition: CascadeDisposition
  relations: RecordCascadeRelation[]
  href?: string
}

export type RecordCascadePlan = {
  root: {
    key: string
    entityType: RecordLifecycleEntityType
    entityId: string
    label: string
    code: string
    status: string
    family: string
    table: string
    protected: boolean
  }
  nodes: RecordCascadeNode[]
  totals: {
    attached: number
    active: number
    protected: number
    deletable: number
    detachable: number
    archivable: number
  }
  warnings: string[]
  acknowledgementPhrase: string
}

export type RecordCascadeSelection = {
  key: string
  disposition: CascadeDisposition
}

export type RecordLifecycleInspection = {
  entityType: RecordLifecycleEntityType
  entityId: string
  label: string
  code: string
  status: string
  family: string
  record: JsonRecord
  immutable: boolean
  immutableReason: string
  dependencies: RecordDependency[]
  allowedActions: RecordLifecycleAction[]
  blockedActions: Array<{ action: RecordLifecycleAction; reason: string }>
  consequence: {
    activeDependencies: number
    totalDependencies: number
    restorationPossible: boolean
    permanentDeleteAllowed: boolean
    summary: string
  }
}

type DependencySpec = {
  entityType: string
  label: string
  table: string
  field: string
  match?: 'eq' | 'contains' | 'nullable_eq'
  parentField?: string
  activeStatuses?: string[]
}

type EntityConfig = {
  type: RecordLifecycleEntityType
  family: string
  label: string
  table: string
  titleFields: string[]
  codeFields: string[]
  statusField?: string
  archiveStatus?: string
  restoreStatus?: string
  cancelStatus?: string
  suspendStatus?: string
  reopenStatus?: string
  supersedeStatus?: string
  terminalStatuses?: string[]
  immutableStatuses?: string[]
  alwaysImmutable?: boolean
  editableFields?: string[]
  dependencies?: DependencySpec[]
}

const ACTIVE_DEFAULT = ['active','approved','ready','assigned','accepted','in_progress','checkpoint','submitted','ai_review','human_review','revision','validated','scheduled','published','verified','running','queued','claimed','retry_scheduled','awaiting_decision','awaiting_approval','effective','materialized','open']

const CONFIGS: Record<RecordLifecycleEntityType, EntityConfig> = {
  signal: { type:'signal', family:'Intelligence', label:'Signal', table:'market_content_signals', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'deferred', restoreStatus:'captured', cancelStatus:'rejected', reopenStatus:'captured', terminalStatuses:['converted'], editableFields:['title','summary','source_label','source_url','services','audiences','cities'], dependencies:[{entityType:'strategy',label:'Stratégies utilisant ce signal',table:'market_content_strategies',field:'signal_ids',match:'contains'}] },
  strategy: { type:'strategy', family:'Stratégie', label:'Stratégie', table:'market_content_strategies', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'suspended', suspendStatus:'suspended', reopenStatus:'draft', immutableStatuses:['approved','active','completed'], editableFields:['title','problem_statement','desired_perception','business_objective','content_objective','services','audiences','cities'], dependencies:[{entityType:'action_plan',label:'Plans d’action',table:'market_content_action_plans',field:'strategy_id'},{entityType:'mission',label:'Missions',table:'market_content_missions',field:'strategy_id'},{entityType:'dossier',label:'Dossiers',table:'market_content_dossiers',field:'strategy_id'},{entityType:'asset',label:'Assets de campagne',table:'market_content_assets',field:'campaign_id',match:'nullable_eq'},{entityType:'deliverable',label:'Livrables de campagne',table:'market_content_deliverables',field:'campaign_id',match:'nullable_eq'},{entityType:'approval',label:'Approbations liées',table:'market_content_approvals',field:'target_id'}] },
  action_plan: { type:'action_plan', family:'Stratégie', label:'Plan d’action', table:'market_content_action_plans', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['approved','completed'], editableFields:['title','objective','start_date','end_date','deliverables','required_roles','capacity_estimate_hours'], dependencies:[{entityType:'mission',label:'Missions libérées',table:'market_content_missions',field:'action_plan_id'}] },
  dossier: { type:'dossier', family:'Dossier 360', label:'Dossier', table:'market_content_dossiers', titleFields:['title'], codeFields:['content_code'], statusField:'status', archiveStatus:'archived', restoreStatus:'brief', cancelStatus:'archived', reopenStatus:'revision', immutableStatuses:['validated','scheduled','published','closed'], editableFields:['title','category','subcategory','audience','city','language','channel','objective','message_pillar','offer','cta','priority','owner_name','reviewer_name','due_at'], dependencies:[{entityType:'mission',label:'Missions',table:'market_content_missions',field:'dossier_id'},{entityType:'task',label:'Tâches',table:'market_content_mission_tasks',field:'dossier_id'},{entityType:'checkpoint',label:'Checkpoints',table:'market_content_checkpoints',field:'dossier_id'},{entityType:'evidence',label:'Preuves',table:'market_content_evidence',field:'dossier_id'},{entityType:'human_review',label:'Révisions humaines',table:'market_content_human_reviews',field:'dossier_id'},{entityType:'ai_review',label:'Révisions IA',table:'market_content_ai_reviews',field:'dossier_id'},{entityType:'source_object',label:'Sources canoniques',table:'market_content_source_objects',field:'dossier_id'},{entityType:'source_replacement',label:'Remplacements de source',table:'market_content_source_replacements',field:'dossier_id'},{entityType:'generated_sample',label:'Échantillons générés',table:'market_content_generated_samples',field:'dossier_id'},{entityType:'publication_package',label:'Packages de publication',table:'market_content_publication_packages',field:'dossier_id'},{entityType:'performance_event',label:'Événements de performance',table:'market_content_performance_events',field:'dossier_id'},{entityType:'learning_record',label:'Apprentissages liés',table:'market_content_learning_records',field:'dossier_id',match:'nullable_eq'},{entityType:'approval',label:'Approbations liées',table:'market_content_approvals',field:'target_id'}] },
  mission: { type:'mission', family:'Exécution', label:'Mission', table:'market_content_missions', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'ready', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'in_progress', immutableStatuses:['validated','closed'], editableFields:['title','objective','scope','out_of_scope','success_definition','priority','assigned_to_name','reviewer_name','due_at'], dependencies:[{entityType:'task',label:'Tâches',table:'market_content_mission_tasks',field:'mission_id'},{entityType:'checkpoint',label:'Checkpoints',table:'market_content_checkpoints',field:'mission_id'},{entityType:'evidence',label:'Preuves',table:'market_content_evidence',field:'mission_id'}] },
  task: { type:'task', family:'Exécution', label:'Tâche', table:'market_content_mission_tasks', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'todo', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'todo', immutableStatuses:['done','validated'], editableFields:['title','description','priority','assigned_to_name','due_at','evidence_required','completion_definition'], dependencies:[{entityType:'checkpoint',label:'Checkpoints',table:'market_content_checkpoints',field:'task_id'},{entityType:'evidence',label:'Preuves',table:'market_content_evidence',field:'task_id'}] },
  checkpoint: { type:'checkpoint', family:'Exécution', label:'Checkpoint', table:'market_content_checkpoints', titleFields:['title'], codeFields:['checkpoint_type'], statusField:'status', archiveStatus:'archived', restoreStatus:'pending', cancelStatus:'cancelled', reopenStatus:'pending', immutableStatuses:['completed','accepted'], editableFields:['title','instructions','required_evidence','due_at'], dependencies:[{entityType:'evidence',label:'Preuves liées',table:'market_content_evidence',field:'checkpoint_id'}] },
  evidence: { type:'evidence', family:'Preuve & validation', label:'Preuve', table:'market_content_evidence', titleFields:['title','filename'], codeFields:['id'], statusField:'status', archiveStatus:'superseded', restoreStatus:'submitted', cancelStatus:'rejected', supersedeStatus:'superseded', immutableStatuses:['accepted','reviewed'], editableFields:['title','note'], dependencies:[{entityType:'human_review',label:'Révisions humaines',table:'market_content_human_reviews',field:'evidence_id'},{entityType:'ai_review',label:'Révisions IA',table:'market_content_ai_reviews',field:'evidence_id'}] },
  human_review: { type:'human_review', family:'Preuve & validation', label:'Décision de revue humaine', table:'market_content_human_reviews', titleFields:['summary'], codeFields:['id'], statusField:'result', alwaysImmutable:true, supersedeStatus:'superseded', dependencies:[] },
  ai_review: { type:'ai_review', family:'Preuve & validation', label:'Observation IA', table:'market_content_ai_reviews', titleFields:['summary'], codeFields:['id'], statusField:'result', alwaysImmutable:true, supersedeStatus:'superseded', dependencies:[] },
  source_object: { type:'source_object', family:'Sources & assets', label:'Source canonique', table:'market_content_source_objects', titleFields:['original_filename','safe_filename'], codeFields:['content_code'], statusField:'is_current', supersedeStatus:'false', alwaysImmutable:true, dependencies:[{entityType:'source_replacement',label:'Remplacements — source précédente',table:'market_content_source_replacements',field:'previous_source_id',match:'nullable_eq'},{entityType:'source_replacement',label:'Remplacements — nouvelle source',table:'market_content_source_replacements',field:'new_source_id',match:'nullable_eq'}] },
  source_replacement: { type:'source_replacement', family:'Sources & assets', label:'Remplacement de source', table:'market_content_source_replacements', titleFields:['reason','previous_filename'], codeFields:['id'], statusField:'status', archiveStatus:'cancelled', restoreStatus:'locked', cancelStatus:'cancelled', immutableStatuses:['committed','completed'], editableFields:['reason'] },
  generated_sample: { type:'generated_sample', family:'Production', label:'Échantillon généré', table:'market_content_generated_samples', titleFields:['filename','prompt'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'generated', cancelStatus:'cancelled', immutableStatuses:['accepted'], editableFields:['prompt'], dependencies:[{entityType:'approval',label:'Approbations liées',table:'market_content_approvals',field:'target_id'}] },
  publication_package: { type:'publication_package', family:'Distribution & publication', label:'Package de publication', table:'market_content_publication_packages', titleFields:['channel'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'draft', supersedeStatus:'superseded', immutableStatuses:['published','verified','withdrawn','superseded'], editableFields:['channel','scheduled_at','required_renditions'], dependencies:[{entityType:'performance_event',label:'Événements de performance',table:'market_content_performance_events',field:'publication_package_id',match:'nullable_eq'},{entityType:'approval',label:'Approbations liées',table:'market_content_approvals',field:'target_id'}] },
  asset: { type:'asset', family:'Sources & assets', label:'Asset', table:'market_content_assets', titleFields:['title','name','filename'], codeFields:['code','id'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', supersedeStatus:'superseded', immutableStatuses:['published','approved'], editableFields:['title','name','description','status','due_date','scheduled_date'], dependencies:[{entityType:'publication_record',label:'Publications liées',table:'market_content_publications',field:'asset_id',match:'nullable_eq'},{entityType:'content_ai_run',label:'Exécutions IA liées',table:'market_content_ai_runs',field:'asset_id',match:'nullable_eq'},{entityType:'approval',label:'Approbations liées',table:'market_content_approvals',field:'target_id'}] },
  deliverable: { type:'deliverable', family:'Production', label:'Livrable', table:'market_content_deliverables', titleFields:['title'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'queued', cancelStatus:'cancelled', editableFields:['title','status','readiness','blocked_reason'], dependencies:[{entityType:'approval',label:'Approbations liées',table:'market_content_approvals',field:'target_id'}] },
  publication_record: { type:'publication_record', family:'Distribution & publication', label:'Publication', table:'market_content_publications', titleFields:['channel'], codeFields:['id'], statusField:'state', archiveStatus:'archived', restoreStatus:'queued', cancelStatus:'cancelled', immutableStatuses:['published','dispatched'], editableFields:['scheduled_for','state'] },
  content_ai_run: { type:'content_ai_run', family:'AI & production', label:'Exécution IA contenu', table:'market_content_ai_runs', titleFields:['action'], codeFields:['id'], statusField:'state', archiveStatus:'archived', restoreStatus:'review_required', cancelStatus:'cancelled', immutableStatuses:['accepted','completed'], editableFields:['state'] },
  approval: { type:'approval', family:'Preuve & validation', label:'Décision d’approbation', table:'market_content_approvals', titleFields:['decision','notes','state'], codeFields:['id'], statusField:'state', alwaysImmutable:true },
  performance_event: { type:'performance_event', family:'Impact & apprentissage', label:'Observation de performance', table:'market_content_performance_events', titleFields:['event_type','metric_name'], codeFields:['id'], statusField:'status', alwaysImmutable:true },
  learning_record: { type:'learning_record', family:'Impact & apprentissage', label:'Leçon institutionnelle', table:'market_content_learning_records', titleFields:['title','lesson'], codeFields:['code','id'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', reopenStatus:'draft', supersedeStatus:'superseded', immutableStatuses:['accepted','effective'], editableFields:['title','lesson','applicability','limitations','doctrine_recommendation'] },
  ai_director: { type:'ai_director', family:'AI Director', label:'AI Director', table:'market_content_ai_directors', titleFields:['name'], codeFields:['code'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['approved'], editableFields:['name','mandate','preferred_model','authority_mode','services','content_families','audiences','cities','languages'], dependencies:[{entityType:'dossier',label:'Dossiers assignés',table:'market_content_dossiers',field:'ai_director_id'},{entityType:'mission',label:'Missions assignées',table:'market_content_missions',field:'ai_director_id'}] },
  ai_command: { type:'ai_command', family:'AI Director', label:'Commande IA', table:'market_ai_commands', titleFields:['name'], codeFields:['code'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['deployed','approved'], editableFields:['name','objective','instruction','default_frequency','authority_mode','risk_level','requires_human_review','tags'], dependencies:[{entityType:'ai_schedule',label:'Planifications',table:'market_ai_command_schedules',field:'command_code',parentField:'code'}] },
  ai_skill: { type:'ai_skill', family:'AI Director', label:'Skill IA', table:'market_ai_skills', titleFields:['name'], codeFields:['code'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', reopenStatus:'draft', immutableStatuses:['active'], editableFields:['name','description','default_frequency','mode','risk_level','progressive_levels'] },
  ai_schedule: { type:'ai_schedule', family:'AI Director', label:'Planification IA', table:'market_ai_command_schedules', titleFields:['name'], codeFields:['id'], statusField:'enabled', archiveStatus:'false', restoreStatus:'true', cancelStatus:'false', suspendStatus:'false', reopenStatus:'true', editableFields:['name','frequency','timezone','hour','minute','day_of_week','day_of_month','objective','authority_mode'], dependencies:[{entityType:'ai_execution_job',label:'Jobs d’exécution',table:'market_ai_execution_jobs',field:'schedule_id'}] },
  ai_mission: { type:'ai_mission', family:'AI Director', label:'Mission IA', table:'market_ai_missions', titleFields:['title'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['completed','accepted'], editableFields:['title','objective','sponsor','authority_mode','priority','restrictions','expected_outcomes'], dependencies:[{entityType:'ai_compilation',label:'Compilations',table:'market_ai_compilations',field:'mission_id'},{entityType:'ai_execution_job',label:'Jobs',table:'market_ai_execution_jobs',field:'mission_id'}] },
  ai_compilation: { type:'ai_compilation', family:'AI Director', label:'Compilation IA', table:'market_ai_compilations', titleFields:['title'], codeFields:['compilation_key','id'], statusField:'status', archiveStatus:'superseded', restoreStatus:'awaiting_decision', cancelStatus:'cancelled', supersedeStatus:'superseded', immutableStatuses:['approved','executing','completed'], editableFields:['title','objective','summary'], dependencies:[{entityType:'compilation_item',label:'Items compilés',table:'market_ai_compilation_items',field:'compilation_id'},{entityType:'ai_execution_job',label:'Jobs',table:'market_ai_execution_jobs',field:'compilation_id'},{entityType:'ai_decision',label:'Décisions',table:'market_ai_decisions',field:'compilation_id'}] },
  compilation_item: { type:'compilation_item', family:'AI Director', label:'Item de compilation', table:'market_ai_compilation_items', titleFields:['title','item_type','target_workspace'], codeFields:['id'], statusField:'status', archiveStatus:'skipped', restoreStatus:'proposed', cancelStatus:'skipped', immutableStatuses:['materialized','linked'] },
  ai_execution_job: { type:'ai_execution_job', family:'AI Director', label:'Job IA', table:'market_ai_execution_jobs', titleFields:['tool_name','job_type'], codeFields:['idempotency_key','id'], statusField:'status', archiveStatus:'archived', restoreStatus:'queued', cancelStatus:'cancelled', suspendStatus:'blocked', reopenStatus:'retry_scheduled', immutableStatuses:['completed','materialized'], dependencies:[{entityType:'ai_decision',label:'Décisions',table:'market_ai_decisions',field:'job_id'},{entityType:'tool_execution',label:'Exécutions d’outil',table:'market_ai_tool_executions',field:'job_id'},{entityType:'dead_letter',label:'Quarantaines',table:'market_ai_dead_letters',field:'job_id'}] },
  tool_execution: { type:'tool_execution', family:'AI Director', label:'Exécution d’outil', table:'market_ai_tool_executions', titleFields:['tool_name'], codeFields:['id'], statusField:'status', immutableStatuses:['completed'] },
  dead_letter: { type:'dead_letter', family:'AI Director', label:'Quarantaine IA', table:'market_ai_dead_letters', titleFields:['reason'], codeFields:['id'], statusField:'status', archiveStatus:'discarded', restoreStatus:'open', cancelStatus:'resolved', immutableStatuses:['resolved','replayed'] },
  ai_decision: { type:'ai_decision', family:'AI Director', label:'Décision IA humaine', table:'market_ai_decisions', titleFields:['decision_type','reason'], codeFields:['id'], statusField:'status', alwaysImmutable:true },
  ai_doctrine: { type:'ai_doctrine', family:'AI Director', label:'Doctrine IA', table:'market_ai_doctrine_entries', titleFields:['title','name'], codeFields:['code','id'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', reopenStatus:'draft', supersedeStatus:'superseded', immutableStatuses:['effective','adopted'], editableFields:['title','content','scope','limitations'] },
  ai_learning: { type:'ai_learning', family:'AI Director', label:'Proposition d’apprentissage IA', table:'market_ai_learning_events', titleFields:['title','lesson'], codeFields:['id'], statusField:'status', archiveStatus:'retired', restoreStatus:'proposed', cancelStatus:'retired', reopenStatus:'proposed', supersedeStatus:'superseded', immutableStatuses:['accepted','effective'], editableFields:['title','lesson','evidence','limitations'] },
}

const TYPE_ORDER = Object.keys(CONFIGS) as RecordLifecycleEntityType[]
const clean = (v: unknown) => String(v ?? '').trim()
const boolLike = (v: string) => v === 'true' ? true : v === 'false' ? false : v
const isMissing = (error: unknown) => {
  const message = clean((error as {message?:string})?.message || error).toLowerCase()
  return message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find')
}
const labelOf = (record: JsonRecord, config: EntityConfig) => config.titleFields.map((field)=>clean(record[field])).find(Boolean) || `${config.label} ${clean(record.id).slice(0,8)}`
const codeOf = (record: JsonRecord, config: EntityConfig) => config.codeFields.map((field)=>clean(record[field])).find(Boolean) || clean(record.id)
const statusOf = (record: JsonRecord, config: EntityConfig) => config.statusField ? clean(record[config.statusField]) : 'recorded'
const isActiveStatus = (status: string, activeStatuses?: string[]) => (activeStatuses || ACTIVE_DEFAULT).includes(status)

function routeForDependency(entityType:string,id:string){
  const encoded=encodeURIComponent(id)
  if(entityType==='strategy')return `/market-os/content-command-center/strategies?strategyId=${encoded}`
  if(entityType==='dossier')return `/market-os/content-command-center/dossiers/${encoded}`
  if(entityType==='mission')return `/market-os/content-command-center/missions?missionId=${encoded}`
  if(entityType==='task')return `/market-os/content-command-center/tasks/${encoded}`
  if(entityType==='signal')return `/market-os/content-command-center/opportunities?signalId=${encoded}`
  if(entityType==='publication_package')return `/market-os/content-command-center/publishing?packageId=${encoded}`
  return `/market-os/content-command-center/record-governance?entityType=${encodeURIComponent(entityType)}&entityId=${encoded}`
}

async function getRecord(config: EntityConfig, id: string): Promise<JsonRecord> {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
  if (result.error) throw result.error
  if (!result.data) throw new Error('RECORD_NOT_FOUND')
  return result.data as JsonRecord
}

async function inspectDependency(spec: DependencySpec, entityId: string): Promise<RecordDependency> {
  const supabase = await createServiceClient() as any
  try {
    let query = supabase.from(spec.table).select('*').limit(50)
    query = spec.match === 'contains' ? query.contains(spec.field, [entityId]) : query.eq(spec.field, entityId)
    const result = await query
    if (result.error) throw result.error
    const rows = Array.isArray(result.data) ? result.data as JsonRecord[] : []
    const active = rows.filter((row)=>isActiveStatus(clean(row.status ?? row.state ?? row.enabled), spec.activeStatuses))
    return {
      entityType: spec.entityType,
      label: spec.label,
      table: spec.table,
      count: rows.length,
      activeCount: active.length,
      blocking: active.length > 0,
      examples: rows.slice(0,5).map((row)=>({ id:clean(row.id), label:clean(row.title||row.name||row.code||row.filename||row.id), status:clean(row.status||row.state||row.enabled||'recorded'), href:routeForDependency(spec.entityType,clean(row.id)) })),
    }
  } catch (error) {
    if (isMissing(error)) return { entityType:spec.entityType,label:spec.label,table:spec.table,count:0,activeCount:0,blocking:false,examples:[] }
    throw error
  }
}

function deriveActions(config: EntityConfig, record: JsonRecord, dependencies: RecordDependency[]) {
  const status = statusOf(record, config)
  const immutable = Boolean(config.alwaysImmutable || config.immutableStatuses?.includes(status))
  const activeDependencies = dependencies.reduce((sum,item)=>sum+item.activeCount,0)
  const totalDependencies = dependencies.reduce((sum,item)=>sum+item.count,0)
  const allowed: RecordLifecycleAction[] = []
  const blocked: Array<{action:RecordLifecycleAction;reason:string}> = []
  const consider = (action: RecordLifecycleAction, possible: boolean, reason: string) => possible ? allowed.push(action) : blocked.push({action,reason})
  consider('edit', Boolean(config.editableFields?.length) && !immutable, immutable ? 'Un enregistrement institutionnel verrouillé exige un amendement ou une nouvelle version.' : 'Aucun champ modifiable n’est déclaré.')
  consider('cancel', Boolean(config.cancelStatus) && status !== config.cancelStatus && !immutable, immutable ? 'La décision historique ne peut pas être annulée silencieusement.' : 'Aucun état d’annulation sûr n’est exposé.')
  consider('suspend', Boolean(config.suspendStatus) && status !== config.suspendStatus && !immutable, immutable ? 'L’enregistrement est verrouillé.' : 'Suspension non prise en charge.')
  consider('archive', Boolean(config.archiveStatus) && status !== config.archiveStatus && !immutable, immutable ? 'Utiliser la supersession, le retrait ou la révocation.' : 'Archivage non pris en charge.')
  consider('soft_delete', Boolean(config.archiveStatus) && status !== config.archiveStatus && !immutable, immutable ? 'Une preuve ou décision immuable ne peut pas être placée en corbeille.' : 'La corbeille exige un état d’archive restaurable.')
  consider('restore', Boolean(config.restoreStatus) && [config.archiveStatus,config.cancelStatus,config.suspendStatus,'archived','retired','cancelled','paused','false'].filter(Boolean).includes(status), 'La restauration n’est disponible que pour un état archivé, annulé ou suspendu.')
  consider('reopen', Boolean(config.reopenStatus) && ['closed','cancelled','retired','superseded','completed','blocked','rejected'].includes(status), 'La réouverture exige un état terminal compatible.')
  consider('supersede', Boolean(config.supersedeStatus) && status !== config.supersedeStatus, 'Supersession non prise en charge.')
  consider('cascade_archive', Boolean(config.archiveStatus), 'Archivage en cascade indisponible pour ce type.')
  consider('permanent_delete', true, 'La purge reste disponible sous permission dédiée, confirmation typée et reconnaissance explicite de toutes les conséquences.')
  return { immutable, activeDependencies, totalDependencies, allowed, blocked }
}

export function getRecordLifecycleCatalog() {
  return TYPE_ORDER.map((type)=>{ const c=CONFIGS[type]; return {type:c.type,family:c.family,label:c.label,table:c.table,editableFields:c.editableFields||[],alwaysImmutable:Boolean(c.alwaysImmutable)} })
}

export async function inspectRecordLifecycle(entityType: RecordLifecycleEntityType, entityId: string): Promise<RecordLifecycleInspection> {
  const config = CONFIGS[entityType]
  if (!config) throw new Error('INVALID_ENTITY_TYPE')
  const record = await getRecord(config, entityId)
  const dependencies = await Promise.all((config.dependencies || []).map((spec)=>inspectDependency(spec, entityId)))
  const derived = deriveActions(config, record, dependencies)
  const status = statusOf(record, config)
  const immutableReason = derived.immutable ? (config.alwaysImmutable ? 'Ce registre constitue une preuve ou décision institutionnelle immuable.' : `L’état ${status} verrouille l’édition et la suppression directe.`) : ''
  return {
    entityType, entityId, label:labelOf(record,config), code:codeOf(record,config), status, family:config.family, record,
    immutable:derived.immutable, immutableReason, dependencies, allowedActions:derived.allowed, blockedActions:derived.blocked,
    consequence:{ activeDependencies:derived.activeDependencies,totalDependencies:derived.totalDependencies,restorationPossible:Boolean(config.archiveStatus&&config.restoreStatus),permanentDeleteAllowed:derived.allowed.includes('permanent_delete'),summary:derived.totalDependencies?`${derived.totalDependencies} relation(s) détectée(s), dont ${derived.activeDependencies} active(s).`:'Aucune dépendance persistée détectée.' }
  }
}

export async function listGovernedRecords(input:{entityType?:RecordLifecycleEntityType;family?:string;state?:string;search?:string;limit?:number}) {
  const types = input.entityType ? [input.entityType] : input.family ? TYPE_ORDER.filter((type)=>CONFIGS[type].family===input.family) : TYPE_ORDER
  const limit = Math.min(100,Math.max(5,input.limit||30))
  const supabase = await createServiceClient() as any
  const results = await Promise.all(types.map(async(type)=>{
    const config=CONFIGS[type]
    try {
      let query=supabase.from(config.table).select('*').limit(limit)
      if(config.statusField && input.state && input.state!=='all') {
        if (config.statusField === 'enabled' || config.statusField === 'is_current') {
          const boolState = input.state === 'active' ? true : input.state === 'archived' || input.state === 'cancelled' ? false : input.state === 'true'
          query = query.eq(config.statusField, boolState)
        } else {
          const states = (input.state==='archived' ? [config.archiveStatus,'archived','retired','superseded']
            : input.state==='cancelled' ? [config.cancelStatus,'cancelled','rejected']
            : input.state==='active' ? ACTIVE_DEFAULT : [input.state]).filter((value): value is string => Boolean(value))
          if(states.length) query=query.in(config.statusField,states)
        }
      }
      const result=await query
      if(result.error) throw result.error
      let rows=(Array.isArray(result.data)?result.data:[]) as JsonRecord[]
      const needle=clean(input.search).toLocaleLowerCase('fr-FR')
      if(needle) rows=rows.filter(row=>`${labelOf(row,config)} ${codeOf(row,config)} ${statusOf(row,config)}`.toLocaleLowerCase('fr-FR').includes(needle))
      return rows.slice(0,limit).map(row=>({entityType:type,entityId:clean(row.id),family:config.family,label:labelOf(row,config),code:codeOf(row,config),status:statusOf(row,config),updatedAt:clean(row.updated_at||row.created_at),immutable:Boolean(config.alwaysImmutable||config.immutableStatuses?.includes(statusOf(row,config))) }))
    } catch(error){ if(isMissing(error)) return []; throw error }
  }))
  return results.flat().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,limit*3)
}


async function dependencyRows(spec: DependencySpec, parentValue: string) {
  const supabase = await createServiceClient() as any
  let query = supabase.from(spec.table).select('*').limit(1000)
  query = spec.match === 'contains' ? query.contains(spec.field, [parentValue]) : query.eq(spec.field, parentValue)
  const result = await query
  if (result.error) {
    if (isMissing(result.error)) return [] as JsonRecord[]
    throw result.error
  }
  return (Array.isArray(result.data) ? result.data : []) as JsonRecord[]
}

export async function buildRecordCascadePlan(entityType: RecordLifecycleEntityType, entityId: string): Promise<RecordCascadePlan> {
  const rootConfig = CONFIGS[entityType]
  if (!rootConfig) throw new Error('INVALID_ENTITY_TYPE')
  const rootRecord = await getRecord(rootConfig, entityId)
  const rootStatus = statusOf(rootRecord, rootConfig)
  const rootProtected = Boolean(rootConfig.alwaysImmutable || rootConfig.immutableStatuses?.includes(rootStatus))
  const nodes = new Map<string, RecordCascadeNode>()
  const queue: Array<{ entityType: RecordLifecycleEntityType; entityId: string; depth: number; parentKey: string; record: JsonRecord }> = [
    { entityType, entityId, depth: 0, parentKey: `${entityType}:${entityId}`, record: rootRecord },
  ]
  const expanded = new Set<string>()

  while (queue.length) {
    const current = queue.shift()!
    const currentKey = `${current.entityType}:${current.entityId}`
    if (expanded.has(currentKey)) continue
    expanded.add(currentKey)
    if (nodes.size > 1500) {
      throw new ContentCommandActionError({
        code: 'CASCADE_SCOPE_TOO_LARGE',
        message: 'Le périmètre attaché dépasse 1 500 objets. Utilisez Record Governance pour traiter ce portefeuille par lot.',
        status: 409,
        kind: 'conflict',
        details: { root: currentKey, currentSize: nodes.size },
        recovery: [{ key: 'open_governance', label: 'Ouvrir Record Governance', href: `/market-os/content-command-center/record-governance?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}` }],
      })
    }
    const currentConfig = CONFIGS[current.entityType]
    if (!currentConfig) continue
    for (const spec of currentConfig.dependencies || []) {
      const childType = spec.entityType as RecordLifecycleEntityType
      const childConfig = CONFIGS[childType]
      if (!childConfig) continue
      const parentValue = clean(spec.parentField ? current.record[spec.parentField] : current.entityId)
      if (!parentValue) continue
      const rows = await dependencyRows(spec, parentValue)
      for (const row of rows) {
        const childId = clean(row.id)
        if (!childId) continue
        const key = `${childType}:${childId}`
        const childStatus = statusOf(row, childConfig)
        const relation: RecordCascadeRelation = {
          parentKey: currentKey,
          parentEntityType: current.entityType,
          parentEntityId: current.entityId,
          childTable: spec.table,
          field: spec.field,
          match: spec.match === 'contains' ? 'contains' : spec.match === 'nullable_eq' ? 'nullable_eq' : 'eq',
          parentValue,
          label: spec.label,
        }
        const availableDispositions: CascadeDisposition[] = ['delete']
        if (spec.match === 'contains' || spec.match === 'nullable_eq') availableDispositions.push('detach')
        if (childConfig.archiveStatus || childConfig.cancelStatus || childConfig.suspendStatus) availableDispositions.push('archive')
        const existing = nodes.get(key)
        if (existing) {
          existing.depth = Math.max(existing.depth, current.depth + 1)
          if (!existing.relations.some(item => item.parentKey === relation.parentKey && item.field === relation.field)) existing.relations.push(relation)
          const fullyDetachable = existing.relations.every(item => item.match === 'contains' || item.match === 'nullable_eq')
          if (fullyDetachable && !existing.availableDispositions.includes('detach')) existing.availableDispositions.push('detach')
          if (!fullyDetachable) existing.availableDispositions = existing.availableDispositions.filter(item => item !== 'detach')
          existing.recommendedDisposition = fullyDetachable ? 'detach' : 'delete'
        } else {
          const protectedRecord = Boolean(childConfig.alwaysImmutable || childConfig.immutableStatuses?.includes(childStatus))
          nodes.set(key, {
            key,
            entityType: childType,
            entityId: childId,
            label: labelOf(row, childConfig),
            code: codeOf(row, childConfig),
            status: childStatus,
            family: childConfig.family,
            table: childConfig.table,
            depth: current.depth + 1,
            active: isActiveStatus(childStatus, spec.activeStatuses),
            protected: protectedRecord,
            availableDispositions,
            recommendedDisposition: spec.match === 'contains' || spec.match === 'nullable_eq' ? 'detach' : 'delete',
            relations: [relation],
            href: routeForDependency(childType, childId),
          })
        }
        queue.push({ entityType: childType, entityId: childId, depth: current.depth + 1, parentKey: key, record: row })
      }
    }
  }

  const ordered = Array.from(nodes.values()).sort((a, b) => b.depth - a.depth || a.family.localeCompare(b.family, 'fr'))
  const active = ordered.filter(node => node.active).length
  const protectedCount = ordered.filter(node => node.protected).length + (rootProtected ? 1 : 0)
  const warnings = [
    ordered.length ? `${ordered.length} objet(s) attaché(s) seront inclus dans la décision.` : 'Aucun objet attaché détecté.',
    active ? `${active} objet(s) sont encore actifs.` : 'Aucun objet attaché actif.',
    protectedCount ? `${protectedCount} objet(s) portent un historique validé, publié ou institutionnel.` : 'Aucun historique protégé détecté.',
    'Une trace d’audit minimale de la décision et du périmètre demeure conservée.',
  ]
  const phrase = `DELETE ${codeOf(rootRecord, rootConfig) || labelOf(rootRecord, rootConfig)}`
  return {
    root: {
      key: `${entityType}:${entityId}`,
      entityType,
      entityId,
      label: labelOf(rootRecord, rootConfig),
      code: codeOf(rootRecord, rootConfig),
      status: rootStatus,
      family: rootConfig.family,
      table: rootConfig.table,
      protected: rootProtected,
    },
    nodes: ordered,
    totals: {
      attached: ordered.length,
      active,
      protected: protectedCount,
      deletable: ordered.length,
      detachable: ordered.filter(node => node.availableDispositions.includes('detach')).length,
      archivable: ordered.filter(node => node.availableDispositions.includes('archive')).length,
    },
    warnings,
    acknowledgementPhrase: phrase,
  }
}

async function archiveCascadeNode(node: RecordCascadeNode) {
  const config = CONFIGS[node.entityType]
  const target = config.archiveStatus || config.cancelStatus || config.suspendStatus
  if (!target) return { preserved: true, reason: 'NO_ARCHIVE_STATE' }
  await updateStatus(config, node.entityId, target)
  return { preserved: false }
}

export async function executeRecordCascadeDelete(input: {
  actorId: string
  actorName: string
  entityType: RecordLifecycleEntityType
  entityId: string
  reason: string
  confirmation: string
  selections: RecordCascadeSelection[]
  acknowledgeAll: boolean
  acknowledgeIrreversible: boolean
  acknowledgeProtected?: boolean
}) {
  if (clean(input.reason).length < 8) throw new ContentCommandActionError({ code: 'REASON_REQUIRED', message: 'Un motif de huit caractères minimum est requis.', status: 400, kind: 'validation', recovery: [{ key: 'complete_reason', label: 'Compléter le motif' }] })
  const plan = await buildRecordCascadePlan(input.entityType, input.entityId)
  if (clean(input.confirmation) !== plan.acknowledgementPhrase) throw new ContentCommandActionError({ code: 'TYPED_CONFIRMATION_MISMATCH', message: `Recopiez exactement ${plan.acknowledgementPhrase}.`, status: 400, kind: 'validation', details: { expected: plan.acknowledgementPhrase }, recovery: [{ key: 'correct_confirmation', label: 'Corriger la confirmation' }] })
  if (!input.acknowledgeAll || !input.acknowledgeIrreversible) throw new ContentCommandActionError({ code: 'CASCADE_ACKNOWLEDGEMENT_REQUIRED', message: 'Cochez la reconnaissance complète du périmètre et du caractère irréversible.', status: 400, kind: 'validation', details: { plan }, recovery: [{ key: 'acknowledge_all', label: 'Reconnaître tout le périmètre' }] })
  if (plan.totals.protected > 0 && !input.acknowledgeProtected) throw new ContentCommandActionError({ code: 'PROTECTED_HISTORY_ACKNOWLEDGEMENT_REQUIRED', message: 'Le périmètre contient un historique validé, publié ou institutionnel. Une reconnaissance dédiée est obligatoire.', status: 400, kind: 'protected_record', details: { plan }, recovery: [{ key: 'acknowledge_protected', label: 'Reconnaître l’historique protégé' }] })

  const selections = new Map(input.selections.map(item => [item.key, item.disposition]))
  const missing = plan.nodes.filter(node => !selections.has(node.key))
  if (missing.length) throw new ContentCommandActionError({ code: 'CASCADE_SCOPE_INCOMPLETE', message: `${missing.length} objet(s) attaché(s) ne sont pas couverts par la décision.`, status: 409, kind: 'dependency', details: { plan, missing: missing.slice(0, 30) }, recovery: [{ key: 'select_all', label: 'Sélectionner tout le périmètre' }] })
  for (const node of plan.nodes) {
    const disposition = selections.get(node.key)!
    if (!node.availableDispositions.includes(disposition)) throw new ContentCommandActionError({ code: 'CASCADE_DISPOSITION_INVALID', message: `L’action ${disposition} n’est pas disponible pour ${node.code || node.label}.`, status: 409, kind: 'dependency', details: { node, disposition }, recovery: [{ key: 'review_scope', label: 'Réviser le périmètre' }] })
    if (disposition === 'archive') throw new ContentCommandActionError({ code: 'ARCHIVE_CANNOT_RELEASE_DELETE_DEPENDENCY', message: `L’archivage de ${node.code || node.label} conserve sa liaison. Choisissez Supprimer ou Détacher pour une purge racine.`, status: 409, kind: 'dependency', details: { node }, recovery: [{ key: 'delete_or_detach', label: 'Supprimer ou détacher' }] })
  }

  const supabase = await createServiceClient() as any
  const rpcItems = plan.nodes.map(node => ({
    id: node.entityId,
    key: node.key,
    table: node.table,
    depth: node.depth,
    disposition: selections.get(node.key),
    relations: node.relations.map(relation => ({ field: relation.field, match: relation.match, parentValue: relation.parentValue })),
  }))
  const execution = await supabase.rpc('market_content_execute_owner_cascade', {
    p_root_table: plan.root.table,
    p_root_id: plan.root.entityId,
    p_items: rpcItems,
    p_actor_id: input.actorId || null,
    p_actor_name: input.actorName,
    p_reason: input.reason,
    p_plan: { root: plan.root, totals: plan.totals, warnings: plan.warnings, selections: input.selections },
  })
  if (execution.error) {
    const message = clean(execution.error.message || execution.error)
    if (message.toLowerCase().includes('market_content_execute_owner_cascade') || message.toLowerCase().includes('schema cache')) {
      throw new ContentCommandActionError({
        code: 'OWNER_CASCADE_SQL_REQUIRED',
        message: 'Le moteur transactionnel de suppression en cascade n’est pas encore installé dans Supabase. Appliquez la migration Owner-Controlled Cascade avant de relancer.',
        status: 503,
        kind: 'system',
        details: { migration: '20260731_0115_content_command_owner_controlled_cascade.sql', cause: message },
        recovery: [{ key: 'apply_migration', label: 'Appliquer la migration SQL' }, { key: 'archive_instead', label: 'Archiver tout le cycle' }],
      })
    }
    throw execution.error
  }
  return { deleted: true, cascade: true, atomic: true, plan, execution: execution.data }
}

export async function executeRecordCascadeArchive(input: {
  actorId: string
  actorName: string
  entityType: RecordLifecycleEntityType
  entityId: string
  reason: string
  acknowledgeAll: boolean
}) {
  if (clean(input.reason).length < 8) throw new ContentCommandActionError({ code: 'REASON_REQUIRED', message: 'Un motif de huit caractères minimum est requis.', status: 400, kind: 'validation', recovery: [{ key: 'complete_reason', label: 'Compléter le motif' }] })
  if (!input.acknowledgeAll) throw new ContentCommandActionError({ code: 'CASCADE_ACKNOWLEDGEMENT_REQUIRED', message: 'Cochez la reconnaissance du périmètre avant l’archivage en cascade.', status: 400, kind: 'validation', recovery: [{ key: 'acknowledge_all', label: 'Reconnaître tout le périmètre' }] })
  const plan = await buildRecordCascadePlan(input.entityType, input.entityId)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'record.cascade_archive.requested', entityType: input.entityType, entityId: input.entityId, detail: { reason: input.reason, plan } })
  const results: Array<{ key: string; archived: boolean; preserved?: boolean }> = []
  for (const node of plan.nodes) {
    const archived = await archiveCascadeNode(node)
    results.push({ key: node.key, archived: !archived.preserved, preserved: archived.preserved })
  }
  const rootConfig = CONFIGS[input.entityType]
  const rootTarget = rootConfig.archiveStatus || rootConfig.cancelStatus || rootConfig.suspendStatus
  if (!rootTarget) throw new ContentCommandActionError({ code: 'ARCHIVE_UNAVAILABLE', message: 'Aucun état d’archive ou d’annulation n’est disponible pour cet objet.', status: 409, kind: 'conflict', details: { plan } })
  await updateStatus(rootConfig, input.entityId, rootTarget)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'record.cascade_archive.completed', entityType: input.entityType, entityId: input.entityId, detail: { reason: input.reason, planSummary: plan.totals, results } })
  return { archived: true, cascade: true, plan, results }
}

function filteredPatch(config: EntityConfig, patch: JsonRecord) {
  const allowed=new Set(config.editableFields||[])
  return Object.fromEntries(Object.entries(patch).filter(([key,value])=>allowed.has(key)&&value!==undefined))
}

async function updateStatus(config:EntityConfig, entityId:string, status:string) {
  if(!config.statusField) throw new Error('STATUS_MUTATION_UNAVAILABLE')
  const value=boolLike(status)
  const supabase=await createServiceClient() as any
  const result=await supabase.from(config.table).update({[config.statusField]:value,updated_at:new Date().toISOString()}).eq('id',entityId).select('*').single()
  if(result.error){
    const fallback=await supabase.from(config.table).update({[config.statusField]:value}).eq('id',entityId).select('*').single()
    if(fallback.error) throw fallback.error
    return fallback.data as JsonRecord
  }
  return result.data as JsonRecord
}

export async function executeRecordLifecycle(input:{actorId:string;actorName:string;entityType:RecordLifecycleEntityType;entityId:string;action:RecordLifecycleAction;reason:string;confirmation?:string;patch?:JsonRecord;cascadeSelections?:RecordCascadeSelection[];acknowledgeAll?:boolean;acknowledgeIrreversible?:boolean;acknowledgeProtected?:boolean}) {
  const config=CONFIGS[input.entityType]
  if(!config) throw new Error('INVALID_ENTITY_TYPE')
  if(clean(input.reason).length<8) throw new ContentCommandActionError({code:'REASON_REQUIRED',message:'Un motif de huit caractères minimum est requis.',status:400,kind:'validation',recovery:[{key:'complete_reason',label:'Compléter le motif'}]})
  if(input.action==='cascade_archive') return executeRecordCascadeArchive({actorId:input.actorId,actorName:input.actorName,entityType:input.entityType,entityId:input.entityId,reason:input.reason,acknowledgeAll:Boolean(input.acknowledgeAll)})
  if(input.action==='permanent_delete'&&input.cascadeSelections) return executeRecordCascadeDelete({actorId:input.actorId,actorName:input.actorName,entityType:input.entityType,entityId:input.entityId,reason:input.reason,confirmation:clean(input.confirmation),selections:input.cascadeSelections,acknowledgeAll:Boolean(input.acknowledgeAll),acknowledgeIrreversible:Boolean(input.acknowledgeIrreversible),acknowledgeProtected:Boolean(input.acknowledgeProtected)})
  const inspection=await inspectRecordLifecycle(input.entityType,input.entityId)
  if(!inspection.allowedActions.includes(input.action)) {
    const reason=inspection.blockedActions.find(item=>item.action===input.action)?.reason||'Action non autorisée dans cet état.'
    const hasDependencies=inspection.consequence.totalDependencies>0
    throw new ContentCommandActionError({
      code:hasDependencies?'DEPENDENCY_BLOCKED':inspection.immutable?'RECORD_PROTECTED':'ACTION_BLOCKED',
      message:reason,
      status:409,
      kind:hasDependencies?'dependency':inspection.immutable?'protected_record':'conflict',
      details:{inspection},
      recovery:[
        {key:'inspect_dependencies',label:'Inspecter les dépendances',href:`/market-os/content-command-center/record-governance?entityType=${encodeURIComponent(input.entityType)}&entityId=${encodeURIComponent(input.entityId)}`},
        ...(inspection.allowedActions.includes('archive')?[{key:'archive',label:'Archiver à la place'}]:[]),
        ...(inspection.allowedActions.includes('supersede')?[{key:'supersede',label:'Superséder l’objet'}]:[]),
        {key:'close',label:'Revenir sans modifier'},
      ],
    })
  }
  let result: JsonRecord | {deleted:boolean}
  if(input.action==='edit'){
    const patch=filteredPatch(config,input.patch||{})
    if(!Object.keys(patch).length) throw new Error('EDIT_PATCH_REQUIRED')
    const supabase=await createServiceClient() as any
    let mutation=await supabase.from(config.table).update({...patch,updated_at:new Date().toISOString()}).eq('id',input.entityId).select('*').single()
    if(mutation.error){ mutation=await supabase.from(config.table).update(patch).eq('id',input.entityId).select('*').single() }
    if(mutation.error) throw mutation.error
    result=mutation.data as JsonRecord
  } else if(input.action==='permanent_delete'){
    const plan=await buildRecordCascadePlan(input.entityType,input.entityId)
    if(plan.nodes.length) throw new ContentCommandActionError({code:'CASCADE_DECISION_REQUIRED',message:`${plan.nodes.length} objet(s) attaché(s) exigent une décision explicite. Sélectionnez tout, choisissez Supprimer ou Détacher, reconnaissez les conséquences puis relancez la purge.`,status:409,kind:'dependency',details:{inspection,plan},recovery:[{key:'select_all',label:'Sélectionner tout le périmètre'},{key:'cascade_archive',label:'Archiver tout le cycle'},{key:'close',label:'Revenir sans modifier'}]})
    const expected=plan.acknowledgementPhrase
    if(clean(input.confirmation)!==expected) throw new ContentCommandActionError({code:'TYPED_CONFIRMATION_MISMATCH',message:`Recopiez exactement ${expected} pour confirmer la purge.`,status:400,kind:'validation',details:{expected},recovery:[{key:'correct_confirmation',label:'Corriger la confirmation'}]})
    if(!input.acknowledgeIrreversible) throw new ContentCommandActionError({code:'CASCADE_ACKNOWLEDGEMENT_REQUIRED',message:'Reconnaissez le caractère irréversible avant la purge.',status:400,kind:'validation',details:{plan},recovery:[{key:'acknowledge_irreversible',label:'Reconnaître le caractère irréversible'}]})
    await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'record.permanent_delete.requested',entityType:input.entityType,entityId:input.entityId,detail:{reason:input.reason,label:inspection.label,code:inspection.code,dependencies:inspection.dependencies}})
    const supabase=await createServiceClient() as any
    const deletion=await supabase.from(config.table).delete().eq('id',input.entityId)
    if(deletion.error) throw deletion.error
    result={deleted:true}
  } else {
    const target = input.action==='archive'||input.action==='soft_delete'?config.archiveStatus : input.action==='restore'?config.restoreStatus : input.action==='cancel'?config.cancelStatus : input.action==='suspend'?config.suspendStatus : input.action==='reopen'?config.reopenStatus : config.supersedeStatus
    if(!target) throw new Error('TARGET_STATE_UNAVAILABLE')
    result=await updateStatus(config,input.entityId,target)
  }
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:`record.${input.action}`,entityType:input.entityType,entityId:input.entityId,detail:{reason:input.reason,previousStatus:inspection.status,confirmation:input.action==='permanent_delete'?'typed_match':null,patchFields:input.action==='edit'?Object.keys(filteredPatch(config,input.patch||{})):[]}})
  return {result,inspectionBefore:inspection}
}
