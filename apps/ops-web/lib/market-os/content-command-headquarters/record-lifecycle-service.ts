import { createServiceClient } from '@/lib/supabase/server'
import { auditContentHeadquarters } from './repository'
import type { JsonRecord } from './types'

export type RecordLifecycleAction =
  | 'edit' | 'cancel' | 'suspend' | 'archive' | 'soft_delete' | 'restore' | 'reopen'
  | 'supersede' | 'permanent_delete'

export type RecordLifecycleEntityType =
  | 'signal' | 'strategy' | 'action_plan' | 'dossier' | 'mission' | 'task'
  | 'checkpoint' | 'evidence' | 'human_review' | 'ai_review' | 'source_object'
  | 'generated_sample' | 'publication_package' | 'asset' | 'approval'
  | 'performance_event' | 'learning_record' | 'ai_director'
  | 'ai_command' | 'ai_skill' | 'ai_schedule' | 'ai_mission' | 'ai_compilation'
  | 'ai_execution_job' | 'ai_decision' | 'ai_doctrine' | 'ai_learning'

export type RecordDependency = {
  entityType: string
  label: string
  table: string
  count: number
  activeCount: number
  blocking: boolean
  examples: Array<{ id: string; label: string; status: string }>
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
  match?: 'eq' | 'contains'
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
  strategy: { type:'strategy', family:'Stratégie', label:'Stratégie', table:'market_content_strategies', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'suspended', suspendStatus:'suspended', reopenStatus:'draft', immutableStatuses:['approved','active','completed'], editableFields:['title','problem_statement','desired_perception','business_objective','content_objective','services','audiences','cities'], dependencies:[{entityType:'action_plan',label:'Plans d’action',table:'market_content_action_plans',field:'strategy_id'},{entityType:'mission',label:'Missions',table:'market_content_missions',field:'strategy_id'},{entityType:'dossier',label:'Dossiers',table:'market_content_dossiers',field:'strategy_id'}] },
  action_plan: { type:'action_plan', family:'Stratégie', label:'Plan d’action', table:'market_content_action_plans', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['approved','completed'], editableFields:['title','objective','start_date','end_date','deliverables','required_roles','capacity_estimate_hours'], dependencies:[{entityType:'mission',label:'Missions libérées',table:'market_content_missions',field:'action_plan_id'}] },
  dossier: { type:'dossier', family:'Dossier 360', label:'Dossier', table:'market_content_dossiers', titleFields:['title'], codeFields:['content_code'], statusField:'status', archiveStatus:'archived', restoreStatus:'brief', cancelStatus:'archived', reopenStatus:'revision', immutableStatuses:['validated','scheduled','published','closed'], editableFields:['title','category','subcategory','audience','city','language','channel','objective','message_pillar','offer','cta','priority','owner_name','reviewer_name','due_at'], dependencies:[{entityType:'mission',label:'Missions',table:'market_content_missions',field:'dossier_id'},{entityType:'task',label:'Tâches',table:'market_content_mission_tasks',field:'dossier_id'},{entityType:'checkpoint',label:'Checkpoints',table:'market_content_checkpoints',field:'dossier_id'},{entityType:'evidence',label:'Preuves',table:'market_content_evidence',field:'dossier_id'},{entityType:'human_review',label:'Révisions humaines',table:'market_content_human_reviews',field:'dossier_id'},{entityType:'ai_review',label:'Révisions IA',table:'market_content_ai_reviews',field:'dossier_id'},{entityType:'source_object',label:'Sources canoniques',table:'market_content_source_objects',field:'dossier_id'},{entityType:'publication_package',label:'Packages de publication',table:'market_content_publication_packages',field:'dossier_id'}] },
  mission: { type:'mission', family:'Exécution', label:'Mission', table:'market_content_missions', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'ready', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'in_progress', immutableStatuses:['validated','closed'], editableFields:['title','objective','scope','out_of_scope','success_definition','priority','assigned_to_name','reviewer_name','due_at'], dependencies:[{entityType:'task',label:'Tâches',table:'market_content_mission_tasks',field:'mission_id'},{entityType:'checkpoint',label:'Checkpoints',table:'market_content_checkpoints',field:'mission_id'},{entityType:'evidence',label:'Preuves',table:'market_content_evidence',field:'mission_id'}] },
  task: { type:'task', family:'Exécution', label:'Tâche', table:'market_content_mission_tasks', titleFields:['title'], codeFields:['code'], statusField:'status', archiveStatus:'archived', restoreStatus:'todo', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'todo', immutableStatuses:['done','validated'], editableFields:['title','description','priority','assigned_to_name','due_at','evidence_required','completion_definition'], dependencies:[{entityType:'checkpoint',label:'Checkpoints',table:'market_content_checkpoints',field:'task_id'},{entityType:'evidence',label:'Preuves',table:'market_content_evidence',field:'task_id'}] },
  checkpoint: { type:'checkpoint', family:'Exécution', label:'Checkpoint', table:'market_content_checkpoints', titleFields:['title'], codeFields:['checkpoint_type'], statusField:'status', archiveStatus:'archived', restoreStatus:'pending', cancelStatus:'cancelled', reopenStatus:'pending', immutableStatuses:['completed','accepted'], editableFields:['title','instructions','required_evidence','due_at'], dependencies:[{entityType:'evidence',label:'Preuves liées',table:'market_content_evidence',field:'checkpoint_id'}] },
  evidence: { type:'evidence', family:'Preuve & validation', label:'Preuve', table:'market_content_evidence', titleFields:['title','filename'], codeFields:['id'], statusField:'status', archiveStatus:'superseded', restoreStatus:'submitted', cancelStatus:'rejected', supersedeStatus:'superseded', immutableStatuses:['accepted','reviewed'], editableFields:['title','note'], dependencies:[{entityType:'human_review',label:'Révisions humaines',table:'market_content_human_reviews',field:'evidence_id'},{entityType:'ai_review',label:'Révisions IA',table:'market_content_ai_reviews',field:'evidence_id'}] },
  human_review: { type:'human_review', family:'Preuve & validation', label:'Décision de revue humaine', table:'market_content_human_reviews', titleFields:['summary'], codeFields:['id'], statusField:'result', alwaysImmutable:true, supersedeStatus:'superseded', dependencies:[] },
  ai_review: { type:'ai_review', family:'Preuve & validation', label:'Observation IA', table:'market_content_ai_reviews', titleFields:['summary'], codeFields:['id'], statusField:'result', alwaysImmutable:true, supersedeStatus:'superseded', dependencies:[] },
  source_object: { type:'source_object', family:'Sources & assets', label:'Source canonique', table:'market_content_source_objects', titleFields:['original_filename','safe_filename'], codeFields:['content_code'], statusField:'is_current', supersedeStatus:'false', alwaysImmutable:true, dependencies:[] },
  generated_sample: { type:'generated_sample', family:'Production', label:'Échantillon généré', table:'market_content_generated_samples', titleFields:['prompt'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'generated', cancelStatus:'cancelled', immutableStatuses:['accepted'], editableFields:['prompt'] },
  publication_package: { type:'publication_package', family:'Distribution & publication', label:'Package de publication', table:'market_content_publication_packages', titleFields:['channel'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'draft', supersedeStatus:'superseded', immutableStatuses:['published','verified','withdrawn','superseded'], editableFields:['channel','scheduled_at','required_renditions'], dependencies:[] },
  asset: { type:'asset', family:'Sources & assets', label:'Asset', table:'market_content_assets', titleFields:['title','name','filename'], codeFields:['code','id'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', supersedeStatus:'superseded', immutableStatuses:['published','approved'], editableFields:['title','name','description','status','due_date','scheduled_date'] },
  approval: { type:'approval', family:'Preuve & validation', label:'Décision d’approbation', table:'market_content_approvals', titleFields:['decision','notes'], codeFields:['id'], statusField:'status', alwaysImmutable:true },
  performance_event: { type:'performance_event', family:'Impact & apprentissage', label:'Observation de performance', table:'market_content_performance_events', titleFields:['event_type','metric_name'], codeFields:['id'], statusField:'status', alwaysImmutable:true },
  learning_record: { type:'learning_record', family:'Impact & apprentissage', label:'Leçon institutionnelle', table:'market_content_learning_records', titleFields:['title','lesson'], codeFields:['code','id'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', reopenStatus:'draft', supersedeStatus:'superseded', immutableStatuses:['accepted','effective'], editableFields:['title','lesson','applicability','limitations','doctrine_recommendation'] },
  ai_director: { type:'ai_director', family:'AI Director', label:'AI Director', table:'market_content_ai_directors', titleFields:['name'], codeFields:['code'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['approved'], editableFields:['name','mandate','preferred_model','authority_mode','services','content_families','audiences','cities','languages'], dependencies:[{entityType:'dossier',label:'Dossiers assignés',table:'market_content_dossiers',field:'ai_director_id'},{entityType:'mission',label:'Missions assignées',table:'market_content_missions',field:'ai_director_id'}] },
  ai_command: { type:'ai_command', family:'AI Director', label:'Commande IA', table:'market_ai_commands', titleFields:['name'], codeFields:['code'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['deployed','approved'], editableFields:['name','objective','instruction','default_frequency','authority_mode','risk_level','requires_human_review','tags'], dependencies:[{entityType:'ai_schedule',label:'Planifications',table:'market_ai_command_schedules',field:'command_code'}] },
  ai_skill: { type:'ai_skill', family:'AI Director', label:'Skill IA', table:'market_ai_skills', titleFields:['name'], codeFields:['code'], statusField:'status', archiveStatus:'retired', restoreStatus:'draft', cancelStatus:'retired', reopenStatus:'draft', immutableStatuses:['active'], editableFields:['name','description','default_frequency','mode','risk_level','progressive_levels'] },
  ai_schedule: { type:'ai_schedule', family:'AI Director', label:'Planification IA', table:'market_ai_command_schedules', titleFields:['name'], codeFields:['id'], statusField:'enabled', archiveStatus:'false', restoreStatus:'true', cancelStatus:'false', suspendStatus:'false', reopenStatus:'true', editableFields:['name','frequency','timezone','hour','minute','day_of_week','day_of_month','objective','authority_mode'], dependencies:[{entityType:'ai_execution_job',label:'Jobs d’exécution',table:'market_ai_execution_jobs',field:'schedule_id'}] },
  ai_mission: { type:'ai_mission', family:'AI Director', label:'Mission IA', table:'market_ai_missions', titleFields:['title'], codeFields:['id'], statusField:'status', archiveStatus:'archived', restoreStatus:'draft', cancelStatus:'cancelled', suspendStatus:'paused', reopenStatus:'draft', immutableStatuses:['completed','accepted'], editableFields:['title','objective','sponsor','authority_mode','priority','restrictions','expected_outcomes'], dependencies:[{entityType:'ai_compilation',label:'Compilations',table:'market_ai_compilations',field:'mission_id'},{entityType:'ai_execution_job',label:'Jobs',table:'market_ai_execution_jobs',field:'mission_id'}] },
  ai_compilation: { type:'ai_compilation', family:'AI Director', label:'Compilation IA', table:'market_ai_compilations', titleFields:['title'], codeFields:['compilation_key','id'], statusField:'status', archiveStatus:'superseded', restoreStatus:'awaiting_decision', cancelStatus:'cancelled', supersedeStatus:'superseded', immutableStatuses:['approved','executing','completed'], editableFields:['title','objective','summary'], dependencies:[{entityType:'compilation_item',label:'Items compilés',table:'market_ai_compilation_items',field:'compilation_id'},{entityType:'ai_execution_job',label:'Jobs',table:'market_ai_execution_jobs',field:'compilation_id'},{entityType:'ai_decision',label:'Décisions',table:'market_ai_decisions',field:'compilation_id'}] },
  ai_execution_job: { type:'ai_execution_job', family:'AI Director', label:'Job IA', table:'market_ai_execution_jobs', titleFields:['tool_name','job_type'], codeFields:['idempotency_key','id'], statusField:'status', archiveStatus:'archived', restoreStatus:'queued', cancelStatus:'cancelled', suspendStatus:'blocked', reopenStatus:'retry_scheduled', immutableStatuses:['completed','materialized'], dependencies:[{entityType:'ai_decision',label:'Décisions',table:'market_ai_decisions',field:'job_id'},{entityType:'tool_execution',label:'Exécutions d’outil',table:'market_ai_tool_executions',field:'job_id'},{entityType:'dead_letter',label:'Quarantaines',table:'market_ai_dead_letters',field:'job_id'}] },
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
      examples: rows.slice(0,5).map((row)=>({ id:clean(row.id), label:clean(row.title||row.name||row.code||row.filename||row.id), status:clean(row.status||row.state||row.enabled||'recorded') })),
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
  consider('permanent_delete', !immutable && activeDependencies === 0 && totalDependencies === 0, immutable ? 'Historique institutionnel immuable: révocation ou supersession requise.' : totalDependencies > 0 ? 'Des dépendances doivent être résolues avant toute purge.' : 'Suppression permanente autorisée sous permission purge et confirmation typée.')
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

export async function executeRecordLifecycle(input:{actorId:string;actorName:string;entityType:RecordLifecycleEntityType;entityId:string;action:RecordLifecycleAction;reason:string;confirmation?:string;patch?:JsonRecord}) {
  const config=CONFIGS[input.entityType]
  if(!config) throw new Error('INVALID_ENTITY_TYPE')
  if(clean(input.reason).length<8) throw new Error('REASON_REQUIRED')
  const inspection=await inspectRecordLifecycle(input.entityType,input.entityId)
  if(!inspection.allowedActions.includes(input.action)) throw new Error(`ACTION_BLOCKED:${inspection.blockedActions.find(item=>item.action===input.action)?.reason||'NOT_ALLOWED'}`)
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
    const expected=inspection.code||inspection.label
    if(clean(input.confirmation)!==expected) throw new Error('TYPED_CONFIRMATION_MISMATCH')
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
