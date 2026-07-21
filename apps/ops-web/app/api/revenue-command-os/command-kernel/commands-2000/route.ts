import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import cumulative from '@/lib/revenue-command-os/command-kernel/commands-2000/commands-2000.commands.json'
import coverage from '@/lib/revenue-command-os/command-kernel/commands-2000/commands-2000.coverage.json'
import domainCoverage from '@/lib/revenue-command-os/command-kernel/commands-2000/commands-2000.domain-coverage.json'
import governance from '@/lib/revenue-command-os/command-kernel/commands-2000/commands-2000.governance-matrix.json'
import { COMMANDS_2000_RELEASE } from '@/lib/revenue-command-os/command-kernel/commands-2000'
export const dynamic='force-dynamic'
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({ok:false,error:'Authentification requise.'},{status:401});const permissions=new Set(Array.isArray((user as any).permissions)?(user as any).permissions.map(String):[]);if(!permissions.has('*')&&!permissions.has('revenue_os.commands.view')&&!permissions.has('revenue_os.commands.manage'))return NextResponse.json({ok:false,error:'Permission Commandes 2000 requise.'},{status:403});return NextResponse.json({ok:true,release:COMMANDS_2000_RELEASE,count:cumulative.length,coverage,domainCoverage,governance,commands:cumulative,posture:'shadow',externalActionsEnabled:false})}
