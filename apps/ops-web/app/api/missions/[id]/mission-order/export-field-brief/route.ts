import { Buffer } from 'node:buffer'
import { getMissionOrder } from '@/lib/missions/mission-order'
import { generateSimplePdf } from '@/lib/missions/pdf'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; const order = await getMissionOrder(Number(id)); const lines = order ? [`Code: ${order.mission.code}`, `Service: ${order.mission.serviceType}`, `Client: ${order.mission.familyName}`, `Caregiver: ${order.mission.caregiverName}`, `Sub-missions: ${order.subMissions.length}`, `Routes: ${order.routes.length}`, `Program lines: ${order.programLines.length}`] : ['Mission order not found']; const bytes = generateSimplePdf('ORDRE DE MISSION ANGELCARE', lines); return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="mission-order-${id}.pdf"` } }) }
