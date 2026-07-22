import { adapterEnabled, executionConfig } from './config'
import type { AdapterCode, AdapterConfig, ExecutionActionType } from './types'
const internalActions:ExecutionActionType[]=['create_campaign','create_account_wave','assign_account','prepare_message','prepare_email','schedule_followup','propose_meeting','prepare_meeting_brief','draft_proposal','request_approval','update_stage','launch_rescue_mission','create_delivery_handoff','create_payment_followup','initiate_renewal']
const rows:Array<[AdapterCode,string,string,ExecutionActionType[]]>= [
 ['b2b_partnerships','B2B Partnerships','/api/b2b-partnerships/revenue-os',['create_campaign','create_account_wave','assign_account','update_stage','launch_rescue_mission']],
 ['traininghub_commercial','TrainingHub Commercial','/api/traininghub/commercial/revenue-os',['create_campaign','assign_account','draft_proposal','create_delivery_handoff','initiate_renewal']],
 ['email_os','Email OS','/api/email-os/revenue-os',['prepare_email','schedule_followup','prepare_message']],
 ['opportunities','Opportunities','/api/revenue-opportunities/revenue-os',['update_stage','launch_rescue_mission','initiate_renewal']],
 ['account_plans','Account Plans','/api/account-plans/revenue-os',['assign_account','schedule_followup']],
 ['campaigns','Campaigns','/api/campaigns/revenue-os',['create_campaign','create_account_wave']],
 ['meetings','Meetings','/api/meetings/revenue-os',['propose_meeting','prepare_meeting_brief','schedule_followup']],
 ['proposals','Proposals','/api/proposals/revenue-os',['draft_proposal','request_approval','send_proposal']],
 ['payments','Payments','/api/payments/revenue-os',['create_payment_followup','schedule_followup']],
 ['trainer_planning','Trainer Planning','/api/traininghub/trainer-planning/revenue-os',['create_delivery_handoff','request_approval']],
 ['academy_delivery','Academy Delivery','/api/traininghub/delivery/revenue-os',['create_delivery_handoff','schedule_followup']],
 ['reporting','Reporting','/api/reporting/revenue-os',internalActions],
 ['internal_tasks','Internal Tasks','/api/tasks/revenue-os',internalActions],
]
export function adapterConfigs():AdapterConfig[]{const runtime=executionConfig();const internal=rows.map(([code,label,endpoint,supportedActions])=>({code,label,transport:'internal_api' as const,enabled:adapterEnabled(code),executionMode:runtime.mode,allowInternal:true,allowApprovedExternal:false,endpointEnv:endpoint,credentialEnvNames:['REVENUE_OS_INTERNAL_ADAPTER_SECRET'],supportedActions,timeoutMs:runtime.timeoutMs,maximumAttempts:runtime.maxAttempts,sensitive:false,metadata:{endpoint}}));return[...internal,
 {code:'gmail',label:'Gmail',transport:'google_api',enabled:adapterEnabled('gmail'),executionMode:runtime.mode,allowInternal:true,allowApprovedExternal:runtime.allowApprovedExternal,credentialEnvNames:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN'],supportedActions:['prepare_email','send_email'],timeoutMs:runtime.timeoutMs,maximumAttempts:runtime.maxAttempts,sensitive:true,metadata:{}},
 {code:'whatsapp',label:'WhatsApp',transport:'whatsapp_cloud',enabled:adapterEnabled('whatsapp'),executionMode:runtime.mode,allowInternal:true,allowApprovedExternal:runtime.allowApprovedExternal,credentialEnvNames:['WHATSAPP_ACCESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID'],supportedActions:['prepare_message','send_whatsapp'],timeoutMs:runtime.timeoutMs,maximumAttempts:runtime.maxAttempts,sensitive:true,metadata:{}},
 {code:'calendar',label:'Calendar',transport:'google_api',enabled:adapterEnabled('calendar'),executionMode:runtime.mode,allowInternal:true,allowApprovedExternal:runtime.allowApprovedExternal,credentialEnvNames:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN'],supportedActions:['propose_meeting','create_calendar_event','schedule_followup'],timeoutMs:runtime.timeoutMs,maximumAttempts:runtime.maxAttempts,sensitive:true,metadata:{}}
 ]}
