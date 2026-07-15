import { NextResponse } from "next/server";
import {
  getAllRecommendedGroups,
  SAAS_FACTORY_PHASE5_ADOPTION_TARGETS,
} from "@/lib/saas-factory/phase5-adoption-map";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    targets: SAAS_FACTORY_PHASE5_ADOPTION_TARGETS,
    groups: getAllRecommendedGroups(),
  });
}
