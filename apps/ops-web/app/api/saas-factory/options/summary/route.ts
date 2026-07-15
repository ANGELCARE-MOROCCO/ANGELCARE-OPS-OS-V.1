import { NextResponse } from 'next/server'
import { getOptionsSummary } from '../../../../../lib/saas-factory/options-runtime'
export const dynamic = 'force-dynamic'
export async function GET(){try{return NextResponse.json(await getOptionsSummary())}catch(error){return NextResponse.json({ok:false,sourceConfidence:'fallback',metrics:{},options:[],optionGroups:[],groups:[],groupPolicies:[],optionTemplates:[],modulesImpacted:[],pageContexts:[],modalContexts:[],auditEvents:[],warnings:[{id:'err',severity:'critical',title:'Options failed',detail:error instanceof Error?error.message:'Unknown',recommendedAction:'Check runtime'}],recommendations:[],validation:[]},{status:200})}}
