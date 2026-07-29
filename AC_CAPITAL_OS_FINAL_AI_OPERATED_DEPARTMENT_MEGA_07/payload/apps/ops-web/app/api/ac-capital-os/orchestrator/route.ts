import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { executeCapitalOrchestratorAction, loadCapitalOrchestratorSnapshot } from "@/lib/ac-capital-os/server/capital-orchestrator";
import type { JsonRecord } from "@/lib/ac-capital-os/server/free-provider-types";
export const dynamic = "force-dynamic";
export async function GET() { try { await requireCapitalApiActor(); return Response.json(success(await loadCapitalOrchestratorSnapshot())); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const actor = await requireCapitalApiActor(); if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 }); const body = await request.json() as { action?: string; payload?: JsonRecord }; if (!body.action) throw Object.assign(new Error("ACTION_REQUIRED"), { status: 400 }); return Response.json(success(await executeCapitalOrchestratorAction(body.action, body.payload || {}, actor))); } catch (error) { return apiError(error); } }
