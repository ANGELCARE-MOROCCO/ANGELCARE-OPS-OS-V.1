import { apiError, envelope, insertRow, isWriter, readTable, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCapitalApiActor();
    const runs = await readTable("ac_capital_mz15_browser_acceptance_runs", 500);
    return Response.json(envelope({ runs }));
  } catch (reason) {
    return apiError(reason);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = (await request.json()) as Record<string, unknown>;
    const status = String(body.status || "PARTIAL");
    const record = await insertRow("ac_capital_mz15_browser_acceptance_runs", {
      route: String(body.route || "/ac-capital-os"),
      status,
      page_loaded: body.pageLoaded === true || status === "PASS",
      api_resolved: body.apiResolved === true,
      primary_action_tested: body.primaryActionTested === true,
      modal_tested: body.modalTested === true,
      drawer_tested: body.drawerTested === true,
      keyboard_tested: body.keyboardTested === true,
      responsive_tested: body.responsiveTested === true,
      response_status: body.responseStatus || null,
      primary_api_state: body.primaryApiState || null,
      primary_action_state: body.primaryActionState || null,
      drawer_state: body.drawerState || null,
      keyboard_state: body.keyboardState || null,
      responsive_state: body.responsiveState || null,
      screenshot_path: body.screenshotPath || null,
      evidence: body.evidence || {},
      console_errors: Array.isArray(body.consoleErrors) ? body.consoleErrors : [],
      notes: body.notes || null,
      tested_by: actor.email || actor.name,
      tested_at: new Date().toISOString(),
    });
    return Response.json(success({ record }));
  } catch (reason) {
    return apiError(reason);
  }
}
