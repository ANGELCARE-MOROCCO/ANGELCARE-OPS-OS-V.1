"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function limitValue(raw: string | null) {
  const value = Number(raw || 60);
  return Number.isFinite(value) ? Math.max(1, Math.min(100, Math.trunc(value))) : 60;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const limit = limitValue(request.nextUrl.searchParams.get("limit"));

  const { data, error } = await supabase
    .from("ac_capital_command_activity")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, data: { events: [] } },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: { events: data || [] } });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const supabase = await createClient();

  const row = {
    client_action_id: String(payload.id || ""),
    title: String(payload.title || "Capital command"),
    message: String(payload.message || ""),
    status: String(payload.status || "failed"),
    workspace_key: String(payload.workspaceKey || "ac-capital-os"),
    route: String(payload.route || "/ac-capital-os"),
    stage: String(payload.stage || "recorded"),
    started_at: payload.startedAt || new Date().toISOString(),
    completed_at: payload.completedAt || null,
    action_href: payload.actionHref || null,
    audit_ref: payload.auditRef || null,
    affected_records:
      payload.affectedRecords == null ? null : Number(payload.affectedRecords),
    detail_json:
      payload.detail && typeof payload.detail === "object" ? payload.detail : {},
    is_read: Boolean(payload.read),
  };

  if (!row.client_action_id) {
    return NextResponse.json(
      { ok: false, error: "client action id is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("ac_capital_command_activity")
    .upsert(row, { onConflict: "client_action_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json();
  const supabase = await createClient();

  let query = supabase
    .from("ac_capital_command_activity")
    .update({ is_read: Boolean(payload.read), updated_at: new Date().toISOString() });

  query = payload.all
    ? query.eq("is_read", !Boolean(payload.read))
    : query.eq("client_action_id", String(payload.id || ""));

  const { error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
