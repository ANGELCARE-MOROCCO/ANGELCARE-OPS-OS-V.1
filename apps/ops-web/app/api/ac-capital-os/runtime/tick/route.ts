import { governRoute } from '@/lib/runtime/governor/route'
import { randomUUID } from "node:crypto";
import { apiError, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { processCapitalOrchestratorQueue } from "@/lib/ac-capital-os/server/capital-orchestrator";
import { enqueueDueInstitutionalAgentWork } from "@/lib/ac-capital-os/server/capital-agent-executors";
import { runDueAcCapitalAgents } from "@/lib/ac-capital-os/server/free-provider-control";
import { acquireRuntimeLease, releaseRuntimeLease } from "@/lib/ac-capital-os/server/institutional-runtime";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function runTick(actor: { id?: string; name?: string; email?: string; role?: string; permissions?: string[] }) {
  const holder = `runtime-${randomUUID()}`;
  const lease = await acquireRuntimeLease({ leaseKey: "ac-capital-ultra-runtime", holder, ttlSeconds: 300, metadata: { source: "runtime-tick" } });
  if (!lease.acquired) return { acquired: false, reason: "RUNTIME_LEASE_HELD", lease: lease.lease };
  try {
    const [externalResearchAgents, institutionalAgents] = await Promise.all([
      runDueAcCapitalAgents(actor as never).catch((error) => ({ error: error instanceof Error ? error.message : String(error) })),
      enqueueDueInstitutionalAgentWork(actor).catch((error) => ({ error: error instanceof Error ? error.message : String(error) })),
    ]);
    const queue = await processCapitalOrchestratorQueue(actor, 25);
    const supabase = await createServiceClient();
    const stale = await supabase.from("ac_capital_orchestrator_events").update({ status: "queued", locked_at: null, locked_by: null, available_at: new Date().toISOString(), error_code: "STALE_LOCK_RECOVERED", error_message: "Runtime recovered an abandoned processing lock.", updated_at: new Date().toISOString() }).eq("status", "processing").lt("locked_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()).select("id");
    return { acquired: true, externalResearchAgents, institutionalAgents, queue, staleRecovered: stale.data?.length || 0, staleError: stale.error?.message || null };
  } finally { await releaseRuntimeLease("ac-capital-ultra-runtime", holder).catch(() => null); }
}

export async function GET(request: Request) {
  try {
    const expected = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization") || "";
    if (expected && authorization === `Bearer ${expected}`) return Response.json(success(await runTick({ id: "vercel-cron", name: "AC Capital Runtime", role: "system" })));
    const actor = await requireCapitalApiActor();
    return Response.json(success(await runTick(actor)));
  } catch (error) { return apiError(error); }
}

async function POST__angelcareGovernedImpl() {
  try { const actor = await requireCapitalApiActor(); return Response.json(success(await runTick(actor))); }
  catch (error) { return apiError(error); }
}

export const POST = governRoute(
  {
    workloadClass: 'worker',
    operation: 'POST:/api/ac-capital-os/runtime/tick',
  },
  POST__angelcareGovernedImpl,
)
