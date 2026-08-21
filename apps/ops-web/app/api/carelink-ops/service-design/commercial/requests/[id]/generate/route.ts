import { governRoute } from '@/lib/runtime/governor/route'
import{command}from'@/lib/homeservice-commercial/server/api-command'
async function POST__angelcareGovernedImpl(r:Request,c:{params:Promise<{id:string}>}){const p=await c.params;return command('generate',p.id,r)}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/carelink-ops/service-design/commercial/requests/[id]/generate',
  },
  POST__angelcareGovernedImpl,
)
