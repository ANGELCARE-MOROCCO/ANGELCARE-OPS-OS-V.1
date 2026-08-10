import 'server-only'
import { assertSafeForExternalProvider } from '@/lib/flashcards-os/intelligence/privacy'
import { extractJsonFromProviderText, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'
import type { CommandOutputType, CommandSection } from '../types'

const COMMAND_SCHEMA={type:'object',additionalProperties:false,required:['title','mission','sections','advisoryFindings'],properties:{title:{type:'string'},mission:{type:'string'},sections:{type:'array',minItems:11,maxItems:11,items:{type:'object',additionalProperties:false,required:['key','title','content'],properties:{key:{type:'string',enum:['mission','authority','content','pedagogy','creative','technical','producer','negative','quality','manifest','evidence']},title:{type:'string'},content:{type:'string'}}}},advisoryFindings:{type:'array',items:{type:'string'},maxItems:20}}}
export type CommandCompilationResult={title:string;mission:string;sections:Array<Pick<CommandSection,'key'|'title'|'content'>>;advisoryFindings:string[];modelRequested:string;modelUsed:string|null;fallbackUsed:boolean;promptTokens:number;completionTokens:number;totalTokens:number;costUsd:number;latencyMs:number;responseId:string|null;attemptCount:number}

export async function compileExternalProductionCommand(input:{design:Record<string,unknown>;collection:Record<string,unknown>;outputType:CommandOutputType;edition:string;variant:string;externalProfile:string}):Promise<CommandCompilationResult>{
 const profile=await loadModelProfile('production_command_compiler')
 const context=assertSafeForExternalProvider(JSON.stringify(input,null,2))
 const result=await openRouterFreeCompletion({
  taskProfile:profile.profileKey,
  messages:[
   {role:'system',content:'You are ANGELCARE External Production Command Architect. Compile instructions only. Never generate, render or claim to create any PDF, image, video, classroom deck or source asset. Preserve approved Product Design authority, evidence lineage and human release control.'},
   {role:'user',content:`Compile the complete governed external production command for this approved design and target.\n\n${context.safeText}`},
  ],
  temperature:profile.temperature,
  maxOutputTokens:profile.maxOutputTokens,
  timeoutMs:profile.timeoutMs,
  retryLimit:profile.retryLimit,
  jsonSchema:COMMAND_SCHEMA,
  metadata:{task_profile:'production_command_compiler'},
 })
 const parsed=extractJsonFromProviderText(result.rawContent) as any
 if(!Array.isArray(parsed.sections)||parsed.sections.length!==11)throw new Error('Production command must contain exactly eleven governed sections. No synthetic fallback was generated.')
 return{title:String(parsed.title),mission:String(parsed.mission),sections:parsed.sections.map((item:any)=>({key:String(item.key),title:String(item.title),content:String(item.content)})),advisoryFindings:Array.isArray(parsed.advisoryFindings)?parsed.advisoryFindings.map(String):[],modelRequested:result.requestedRoute,modelUsed:result.actualModel,fallbackUsed:false,promptTokens:result.promptTokens,completionTokens:result.completionTokens,totalTokens:result.totalTokens,costUsd:result.providerReportedCostUsd,latencyMs:result.latencyMs,responseId:result.responseId,attemptCount:result.attemptCount}
}
