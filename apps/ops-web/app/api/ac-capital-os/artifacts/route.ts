import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { buildArtifactContext, createCapitalArtifact, deterministicArtifactContent } from "@/lib/ac-capital-os/server/artifact-factory";
import { executeOpenRouterReport } from "@/lib/ac-capital-os/server/free-provider-runtime";
import { createServiceClient } from "@/lib/supabase/server";
import type { JsonRecord } from "@/lib/ac-capital-os/server/free-provider-types";

export const dynamic = "force-dynamic";

const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

export async function GET(request: Request) {
  try {
    await requireCapitalApiActor();
    const supabase = await createServiceClient();
    const url = new URL(request.url);
    let query = supabase.from("ac_capital_artifacts").select("*").order("updated_at", { ascending: false }).limit(Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 100))));
    const entityType = clean(url.searchParams.get("entityType"));
    const entityId = clean(url.searchParams.get("entityId"));
    if (entityType) query = query.eq("entity_type", entityType);
    if (entityId) query = query.eq("entity_id", entityId);
    const result = await query;
    if (result.error) throw result.error;
    const versions = await supabase.from("ac_capital_artifact_versions").select("*").order("generated_at", { ascending: false }).limit(300);
    if (versions.error) throw versions.error;
    return Response.json(success({ artifacts: result.data || [], versions: versions.data || [] }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as JsonRecord;
    const artifactType = clean(body.artifactType || "founder-capital-brief");
    const title = clean(body.title || artifactType.replaceAll("-", " "));
    const entityType = clean(body.entityType) || undefined;
    const entityId = clean(body.entityId) || undefined;
    const reportId = clean(body.reportId) || undefined;
    const context = await buildArtifactContext({ artifactType, entityType, entityId, reportId });
    let content: JsonRecord = deterministicArtifactContent({ artifactType, title, context });
    let aiEvidence: JsonRecord | null = null;
    if (body.aiCompose === true) {
      const sectionTitles = Array.isArray(content.sections) ? content.sections.map((section) => clean(object(section).title)).filter(Boolean).slice(0, 12) : [];
      const ai = await executeOpenRouterReport({
        reportType: artifactType,
        audience: clean(body.audience || "Founder / Management"),
        purpose: clean(body.purpose || `Produce ${title} from approved AC Capital records.`),
        sections: sectionTitles.length ? sectionTitles : ["Executive Summary", "Readiness", "Risks", "Next Actions"],
        sourceWorkspaces: Array.isArray(body.sourceWorkspaces) ? body.sourceWorkspaces.map(clean).filter(Boolean) : ["orchestrator", entityType || "capital-department"],
        context,
        actorId: actor.id || null,
      });
      content = {
        ...content,
        executiveSummary: ai.executiveSummary,
        sections: ai.sections,
        metadata: { aiConfidence: ai.confidence, missingData: ai.missingData, riskFlags: ai.riskFlags, nextActions: ai.nextActions, providerRunId: ai.freeProviderRunId },
      };
      aiEvidence = { providerResponseId: ai.providerResponseId, providerModelVersion: ai.providerModelVersion, providerRunId: ai.freeProviderRunId, confidence: ai.confidence };
    }
    const artifact = await createCapitalArtifact({
      artifactType, title, entityType, entityId, workflowId: clean(body.workflowId) || undefined, reportId,
      formats: Array.isArray(body.formats) ? body.formats.map(clean).filter(Boolean) : ["pdf", "docx", "xlsx", "zip"],
      content: content as JsonRecord, sourceSnapshot: context, evidenceReferences: aiEvidence ? [aiEvidence] : [],
      confidentiality: clean(body.confidentiality || "Confidential"), actor,
    });
    return Response.json(success({ artifact, content, aiEvidence }));
  } catch (error) { return apiError(error); }
}
