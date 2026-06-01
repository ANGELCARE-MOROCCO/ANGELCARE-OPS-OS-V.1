import { NextResponse } from "next/server";
import { scanFactoryAdoptionCandidates } from "@/lib/saas-factory/phase5-file-scanner";
import { SAAS_FACTORY_PHASE5_ADOPTION_TARGETS } from "@/lib/saas-factory/phase5-adoption-map";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scan = await scanFactoryAdoptionCandidates();

    const plan = SAAS_FACTORY_PHASE5_ADOPTION_TARGETS.map((target) => {
      const findings = scan.findings.filter((finding) => finding.moduleKey === target.moduleKey);
      const critical = findings.filter((finding) => finding.priority === "critical").length;
      const high = findings.filter((finding) => finding.priority === "high").length;
      const normal = findings.filter((finding) => finding.priority === "normal").length;

      return {
        moduleKey: target.moduleKey,
        moduleLabel: target.moduleLabel,
        routePrefix: target.routePrefix,
        recommendedGroups: target.recommendedGroups,
        findingCount: findings.length,
        critical,
        high,
        normal,
        firstFiles: Array.from(new Set(findings.map((finding) => finding.file))).slice(0, 12),
        nextAction:
          critical > 0
            ? "Start with critical city/department/service-category fields."
            : high > 0
              ? "Start with high-priority configurable fields."
              : "Review remaining raw selects and low-risk fields.",
      };
    });

    return NextResponse.json({
      ok: true,
      scannedFiles: scan.scannedFiles,
      plan,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
