import { compileApprovedStrategy } from '@/lib/revenue-command-os/mission-compiler/service'
import type { CompileInput } from '@/lib/revenue-command-os/mission-compiler/types'
export async function processCompilationJob(input:CompileInput){return compileApprovedStrategy({...input,dryRun:false})}
