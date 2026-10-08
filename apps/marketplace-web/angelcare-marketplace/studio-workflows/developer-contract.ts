import { createHash } from 'node:crypto'
import { STUDIO_WORKFLOW_DESCRIPTORS } from './registry'

export const STUDIO_WORKFLOW_DEVELOPER_CONTRACT={
  schemaVersion:'2026-09-19.P07',
  workflowCount:STUDIO_WORKFLOW_DESCRIPTORS.length,
  publicSubmitApi:'/api/angelcare-marketplace/public/studio-workflows/[workflowId]',
  adminRegistryApi:'/api/angelcare-marketplace/cms/studio/workflows',
  invariants:{existingAuthoritiesOnly:true,newAdminWorkspace:false,shadowInbox:false,shadowBooking:false,shadowInquiry:false,shadowEnrollment:false,shadowSubscription:false,p03ActionReuse:true,p02CanonicalTargets:true,publicValidation:true,consentRequiredWhereDeclared:true,p08AssignedTemplateRenderSwitch:false,sqlRequired:false},
  workflows:STUDIO_WORKFLOW_DESCRIPTORS.map(row=>({id:row.id,label:row.label,execution:row.execution,actionId:row.actionId,targetRequired:row.targetRequired,targetSources:[...row.targetSources],canonicalEngine:row.canonicalEngine,creates:row.creates,adminDestination:row.adminDestination,authenticated:Boolean(row.authenticated),fieldCount:row.fields.length,consentKeys:[...row.consentKeys]})),
} as const

export function studioWorkflowDeveloperContractJson(){const body={...STUDIO_WORKFLOW_DEVELOPER_CONTRACT};const json=JSON.stringify(body);return{...body,hash:createHash('sha256').update(json).digest('hex')}}
export function studioWorkflowDeveloperContractTxt(){const c=STUDIO_WORKFLOW_DEVELOPER_CONTRACT;return ['ANGELCARE MARKETPLACE STUDIO — P07 NATIVE WORKFLOWS',`Schema: ${c.schemaVersion}`,`Workflows: ${c.workflowCount}`,...c.workflows.map(row=>`- ${row.id} · ${row.execution} · action=${row.actionId} · creates=${row.creates} · admin=${row.adminDestination}`),'','INVARIANTS',...Object.entries(c.invariants).map(([k,v])=>`${k}=${String(v)}`)].join('\n')+'\n'}
const csv=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
export function studioWorkflowDeveloperContractCsv(){const rows=[['workflow_id','label','execution','action_id','target_required','target_sources','canonical_engine','creates','admin_destination','authenticated','field_count','consent_keys'],...STUDIO_WORKFLOW_DEVELOPER_CONTRACT.workflows.map(row=>[row.id,row.label,row.execution,row.actionId,row.targetRequired,row.targetSources.join('|'),row.canonicalEngine,row.creates,row.adminDestination,row.authenticated,row.fieldCount,row.consentKeys.join('|')])];return rows.map(row=>row.map(csv).join(',')).join('\n')+'\n'}
