import { governRoute } from '@/lib/runtime/governor/route'
import{post}from'@/lib/homeservice-handoff/server/api-command';async function POST__angelcareGovernedImpl(r:Request,{params}:{params:Promise<{id:string}>}){return post('blueprint',r,(await params).id)}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/carelink-ops/service-design/handoffs/[id]/reports',
  },
  POST__angelcareGovernedImpl,
)
