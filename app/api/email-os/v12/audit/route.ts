import { audit, blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';
export async function POST(req: Request) {
  if (!getSupabaseAdmin()) return blockerResponse();
  const body = await req.json();
  const row = await audit(String(body.action || 'manual_checkpoint'), String(body.targetType || 'workspace'), body.targetId || null, String(body.result || 'completed'), body.metadata || {});
  return Response.json({ audit: row });
}
