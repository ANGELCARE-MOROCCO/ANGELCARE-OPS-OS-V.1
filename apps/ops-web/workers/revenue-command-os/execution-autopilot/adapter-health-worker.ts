import 'server-only'
import { adapterRegistry } from '@/lib/revenue-command-os/execution-autopilot/registry'
import { saveAdapterHealth } from '@/lib/revenue-command-os/execution-autopilot/repository'
export async function refreshAdapterHealth(tenantId='angelcare'){const health=await adapterRegistry().health();for(const item of health)await saveAdapterHealth(tenantId,item);return health}
