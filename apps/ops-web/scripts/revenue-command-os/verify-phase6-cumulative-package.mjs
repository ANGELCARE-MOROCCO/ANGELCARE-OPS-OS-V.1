import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();const required=[
'supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql',
'supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql',
'supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql',
'supabase/migrations/20260720_revenue_command_os_phase4_signal_fabric.sql',
'supabase/migrations/20260720_revenue_command_os_phase5_command_kernel.sql',
'supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql',
'scripts/revenue-command-os/verify-phase1.mjs','scripts/revenue-command-os/verify-phase2.mjs',
'scripts/revenue-command-os/verify-phase3.mjs','scripts/revenue-command-os/verify-phase4.mjs',
'scripts/revenue-command-os/verify-phase5.mjs','scripts/revenue-command-os/verify-phase6.mjs'
];const missing=required.filter(x=>!fs.existsSync(path.join(root,x)));console.log(JSON.stringify({suite:'MZ01–MZ06 cumulative package continuity',required:required.length,missing,pass:missing.length===0},null,2));if(missing.length)process.exit(1);
