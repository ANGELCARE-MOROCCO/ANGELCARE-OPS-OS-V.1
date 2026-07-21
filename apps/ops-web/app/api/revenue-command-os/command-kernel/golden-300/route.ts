import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { GOLDEN_300_COMMANDS, GOLDEN_300_RELEASE } from '@/lib/revenue-command-os/command-kernel/golden-300'
import { REVENUE_COMMAND_FAMILIES } from '@/lib/revenue-command-os/command-kernel/constants'
export const dynamic='force-dynamic'
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({ok:false,error:'Authentification requise.'},{status:401});const permissions=new Set(Array.isArray((user as any).permissions)?(user as any).permissions.map(String):[]);if(!permissions.has('*')&&!permissions.has('revenue_os.commands.view')&&!permissions.has('revenue_os.commands.manage'))return NextResponse.json({ok:false,error:'Permission Golden 300 requise.'},{status:403});const coverage=REVENUE_COMMAND_FAMILIES.map(f=>({family:f.code,label:f.name,count:GOLDEN_300_COMMANDS.filter(c=>c.family===f.code).length,targetMZ06:25}));return NextResponse.json({ok:true,release:GOLDEN_300_RELEASE,count:GOLDEN_300_COMMANDS.length,coverage,commands:GOLDEN_300_COMMANDS,posture:'shadow',externalActionsEnabled:false})}
