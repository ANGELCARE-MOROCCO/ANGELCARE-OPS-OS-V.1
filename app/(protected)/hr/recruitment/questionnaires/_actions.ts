"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { logHRActivity } from "@/lib/hr-production/repository";
import { QUESTIONNAIRES_PATH, QUESTIONNAIRES_TABLE, RESPONSES_TABLE } from "./_constants";

type AnyRecord = Record<string, any>;

const allowedRoles = ["ceo", "owner", "super_admin", "admin", "direction", "hr", "hr_admin", "hr_manager", "manager", "operations", "operations_manager", "ops_admin"];

const text = (fd: FormData, key: string, fallback = "") => String(fd.get(key) || fallback).trim();
const num = (fd: FormData, key: string, fallback = 0) => {
  const value = Number(fd.get(key) || fallback);
  return Number.isFinite(value) ? value : fallback;
};
const yes = (fd: FormData, key: string) => ["1", "true", "yes", "on"].includes(text(fd, key).toLowerCase());

function sanitizeHtmlCode(raw: string) {
  return String(raw || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/g)
    .filter((line) => !/^\s*```(?:[A-Za-z0-9_-]+)?\s*$/.test(line))
    .filter((line) => !/^\s*:::writing[^\n]*\s*$/.test(line))
    .filter((line) => !/^\s*:::\s*$/.test(line))
    .join("\n")
    .trim();
}

function compact(row: AnyRecord) {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ""),
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "interview-questionnaire";
}

function makeSlug(title: string) {
  return `${slugify(title)}-${randomBytes(4).toString("hex")}`;
}

function makeCode(title: string) {
  const initials = slugify(title)
    .split("-")
    .filter(Boolean)
    .slice(0, 5)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return `IQ-${initials || "ANG"}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function defaultHtmlTemplate(title: string, roleTarget: string, department: string) {
  const safeTitle = title || "AngelCare Interview Questionnaire";
  const safeRole = roleTarget || "Target role";
  const safeDepartment = department || "HR Recruitment";
  return `
<style>
  .ac-assessment-shell{font-family:Inter,Arial,sans-serif;color:#0f172a;line-height:1.55;}
  .ac-hero{border-radius:30px;padding:28px;background:linear-gradient(135deg,#4f46e5,#a21caf);color:white;box-shadow:0 24px 60px rgba(79,70,229,.20);}
  .ac-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.24em;font-weight:900;opacity:.82;margin:0 0 10px;}
  .ac-title{font-size:34px;line-height:1.05;font-weight:950;margin:0;}
  .ac-subtitle{font-size:14px;font-weight:700;opacity:.82;margin:12px 0 0;max-width:760px;}
  .ac-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px;}
  .ac-pill{border:1px solid rgba(255,255,255,.24);border-radius:20px;padding:12px 14px;background:rgba(255,255,255,.12);font-size:12px;font-weight:900;}
  .ac-section{margin-top:18px;border:1px solid #e2e8f0;border-radius:28px;background:white;padding:22px;box-shadow:0 20px 44px rgba(15,23,42,.08);}
  .ac-section h2{margin:0 0 8px;font-size:18px;font-weight:950;color:#0f172a;}
  .ac-section p{margin:0 0 14px;color:#475569;font-size:13px;font-weight:700;}
  .ac-question{border:1px solid #e5e7eb;border-radius:22px;padding:16px;margin-top:12px;background:#f8fafc;}
  .ac-question label{display:block;font-size:13px;font-weight:950;color:#111827;margin-bottom:10px;}
  .ac-question textarea,.ac-question input,.ac-question select{width:100%;border:1px solid #cbd5e1;border-radius:16px;padding:13px 14px;background:#fff;color:#0f172a;font-size:14px;font-weight:700;outline:none;box-sizing:border-box;}
  .ac-options{display:grid;gap:10px;margin-top:10px;}
  .ac-option{display:flex;gap:10px;align-items:flex-start;border:1px solid #e2e8f0;border-radius:16px;padding:11px 12px;background:#fff;font-size:13px;font-weight:800;color:#334155;}
  .ac-option input{width:auto;margin-top:3px;}
  @media(max-width:760px){.ac-grid{grid-template-columns:1fr}.ac-title{font-size:26px}.ac-hero{padding:22px}}
</style>
<div class="ac-assessment-shell">
  <section class="ac-hero">
    <p class="ac-kicker">AngelCare HR · Online Interview Assessment</p>
    <h1 class="ac-title">${safeTitle}</h1>
    <p class="ac-subtitle">Complete this premium assessment for ${safeRole}. Read every scenario carefully and answer with clear professional judgment.</p>
    <div class="ac-grid">
      <div class="ac-pill">Role: ${safeRole}</div>
      <div class="ac-pill">Department: ${safeDepartment}</div>
      <div class="ac-pill">Format: HTML Assessment</div>
    </div>
  </section>

  <section class="ac-section">
    <h2>1. Motivation and professional profile</h2>
    <p>Explain your motivation, your discipline, and the real value you can bring to AngelCare operations.</p>
    <div class="ac-question">
      <label for="motivation">Why do you want to join AngelCare and what makes you a strong candidate?</label>
      <textarea id="motivation" name="motivation" rows="5" required placeholder="Write a structured answer..."></textarea>
    </div>
  </section>

  <section class="ac-section">
    <h2>2. Scenario-based decisions</h2>
    <p>Choose the best professional reaction in each situation.</p>
    <div class="ac-question">
      <label>A parent is worried because an update was not sent on time. What do you do first?</label>
      <div class="ac-options">
        <label class="ac-option"><input type="radio" name="parent_trust_scenario" value="acknowledge_verify_correct" required> Acknowledge the concern, verify facts quickly, apologize if needed, and provide a corrective follow-up.</label>
        <label class="ac-option"><input type="radio" name="parent_trust_scenario" value="wait_until_end"> Wait until the end of the day before answering.</label>
        <label class="ac-option"><input type="radio" name="parent_trust_scenario" value="avoid_response"> Avoid answering because the situation is uncomfortable.</label>
      </div>
    </div>
    <div class="ac-question">
      <label>A mission becomes operationally risky. What is your priority?</label>
      <div class="ac-options">
        <label class="ac-option"><input type="radio" name="safety_scenario" value="secure_escalate_document" required> Secure the child/client context, escalate to operations, document facts, and follow protocol.</label>
        <label class="ac-option"><input type="radio" name="safety_scenario" value="ignore"> Ignore it if nothing happened yet.</label>
        <label class="ac-option"><input type="radio" name="safety_scenario" value="leave_without_reporting"> Leave without reporting.</label>
      </div>
    </div>
  </section>

  <section class="ac-section">
    <h2>3. Execution discipline</h2>
    <p>Show how you organize priorities, communication, and deadlines.</p>
    <div class="ac-question">
      <label for="execution_plan">You receive five urgent tasks for the same day. How do you organize execution?</label>
      <textarea id="execution_plan" name="execution_plan" rows="5" required></textarea>
    </div>
  </section>
</div>`.trim();
}

function questionnairePayload(fd: FormData, existingSlug?: string) {
  const title = text(fd, "title", "AngelCare Interview Questionnaire");
  const roleTarget = text(fd, "role_target");
  const department = text(fd, "department", "Recruitment");
  const htmlCode = sanitizeHtmlCode(text(fd, "html_code")) || defaultHtmlTemplate(title, roleTarget, department);
  return compact({
    title,
    role_target: roleTarget,
    department,
    language: text(fd, "language", "fr"),
    status: text(fd, "status", "draft"),
    assessment_mode: text(fd, "assessment_mode", "online"),
    duration_minutes: num(fd, "duration_minutes", 45),
    pass_score: num(fd, "pass_score", 70),
    owner: text(fd, "owner"),
    instructions: text(fd, "instructions"),
    html_code: htmlCode,
    html_design_notes: text(fd, "html_design_notes"),
    questionnaire_code: text(fd, "questionnaire_code") || makeCode(title),
    public_slug: existingSlug || text(fd, "public_slug") || makeSlug(title),
    is_public: yes(fd, "is_public"),
    allow_multiple_submissions: yes(fd, "allow_multiple_submissions"),
    valid_from: text(fd, "valid_from"),
    valid_until: text(fd, "valid_until"),
    questions: [],
    competency_matrix: [],
    scoring_rules: text(fd, "scoring_rules"),
    metadata: {
      html_first: true,
      template_kind: "html_interview_questionnaire",
      last_editor_context: "hr_recruitment_questionnaires",
    },
  });
}

export async function createHtmlInterviewQuestionnaire(fd: FormData) {
  const user = await requireRole(allowedRoles);
  const supabase = await createClient();
  const payload = questionnairePayload(fd);

  const { data, error } = await supabase
    .from(QUESTIONNAIRES_TABLE)
    .insert(payload)
    .select("id,title,public_slug")
    .maybeSingle();

  if (error) redirect(`${QUESTIONNAIRES_PATH}?error=${encodeURIComponent(error.message)}`);

  await logHRActivity({
    actor_id: user.id,
    actor_name: user.name || user.email || "HR user",
    action: "html_interview_questionnaire_created",
    entity_type: "hr_interview_questionnaire",
    entity_id: data?.id,
    title: `Created HTML interview questionnaire: ${data?.title || payload.title}`,
    metadata: { public_slug: data?.public_slug },
  });

  revalidatePath(QUESTIONNAIRES_PATH);
  redirect(`${QUESTIONNAIRES_PATH}/${data?.id}`);
}

export async function bulkCreateHtmlInterviewQuestionnaires(fd: FormData) {
  const user = await requireRole(allowedRoles);
  const supabase = await createClient();
  const titles = text(fd, "bulk_titles")
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!titles.length) redirect(`${QUESTIONNAIRES_PATH}?error=${encodeURIComponent("Add at least one questionnaire title.")}`);

  const defaultDepartment = text(fd, "default_department", "Recruitment");
  const defaultOwner = text(fd, "default_owner");
  const defaultRole = text(fd, "default_role");
  const sharedHtml = sanitizeHtmlCode(text(fd, "bulk_html_code"));

  const rows = titles.map((title) => ({
    title,
    questionnaire_code: makeCode(title),
    role_target: defaultRole,
    department: defaultDepartment,
    owner: defaultOwner,
    language: text(fd, "default_language", "fr"),
    status: text(fd, "default_status", "draft"),
    assessment_mode: "online",
    duration_minutes: num(fd, "default_duration_minutes", 45),
    pass_score: num(fd, "default_pass_score", 70),
    public_slug: makeSlug(title),
    is_public: true,
    allow_multiple_submissions: false,
    instructions: text(fd, "bulk_instructions"),
    html_code: sharedHtml || defaultHtmlTemplate(title, defaultRole, defaultDepartment),
    html_design_notes: text(fd, "bulk_design_notes"),
    questions: [],
    competency_matrix: [],
    metadata: { html_first: true, bulk_created: true, template_kind: "html_interview_questionnaire" },
  }));

  const { error } = await supabase.from(QUESTIONNAIRES_TABLE).insert(rows);
  if (error) redirect(`${QUESTIONNAIRES_PATH}?error=${encodeURIComponent(error.message)}`);

  await logHRActivity({
    actor_id: user.id,
    actor_name: user.name || user.email || "HR user",
    action: "html_interview_questionnaires_bulk_created",
    entity_type: "hr_interview_questionnaire",
    title: `Bulk created ${rows.length} HTML interview questionnaires`,
    metadata: { count: rows.length },
  });

  revalidatePath(QUESTIONNAIRES_PATH);
  redirect(QUESTIONNAIRES_PATH);
}

export async function updateHtmlInterviewQuestionnaire(fd: FormData) {
  const user = await requireRole(allowedRoles);
  const id = text(fd, "id");
  if (!id) redirect(QUESTIONNAIRES_PATH);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from(QUESTIONNAIRES_TABLE)
    .select("id,public_slug,title")
    .eq("id", id)
    .maybeSingle();

  const payload = questionnairePayload(fd, String(existing?.public_slug || ""));
  const { error } = await supabase.from(QUESTIONNAIRES_TABLE).update(payload).eq("id", id);
  if (error) redirect(`${QUESTIONNAIRES_PATH}/${id}?edit=1&error=${encodeURIComponent(error.message)}`);

  await logHRActivity({
    actor_id: user.id,
    actor_name: user.name || user.email || "HR user",
    action: "html_interview_questionnaire_updated",
    entity_type: "hr_interview_questionnaire",
    entity_id: id,
    title: `Updated HTML interview questionnaire: ${payload.title || existing?.title || id}`,
    metadata: { html_version: "updated" },
  });

  revalidatePath(QUESTIONNAIRES_PATH);
  revalidatePath(`${QUESTIONNAIRES_PATH}/${id}`);
  redirect(`${QUESTIONNAIRES_PATH}/${id}`);
}

export async function setHtmlInterviewQuestionnaireStatus(fd: FormData) {
  const user = await requireRole(allowedRoles);
  const id = text(fd, "id");
  const status = text(fd, "status", "draft");
  if (!id) redirect(QUESTIONNAIRES_PATH);

  const supabase = await createClient();
  const { error } = await supabase.from(QUESTIONNAIRES_TABLE).update({ status }).eq("id", id);
  if (error) redirect(`${QUESTIONNAIRES_PATH}?error=${encodeURIComponent(error.message)}`);

  await logHRActivity({
    actor_id: user.id,
    actor_name: user.name || user.email || "HR user",
    action: "html_interview_questionnaire_status_changed",
    entity_type: "hr_interview_questionnaire",
    entity_id: id,
    title: `Changed HTML interview questionnaire status to ${status}`,
    metadata: { status },
  });

  revalidatePath(QUESTIONNAIRES_PATH);
  revalidatePath(`${QUESTIONNAIRES_PATH}/${id}`);
  redirect(QUESTIONNAIRES_PATH);
}

export async function deleteHtmlInterviewQuestionnaire(fd: FormData) {
  const user = await requireRole(allowedRoles);
  const id = text(fd, "id");
  if (!id) redirect(QUESTIONNAIRES_PATH);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from(QUESTIONNAIRES_TABLE)
    .select("id,title,public_slug")
    .eq("id", id)
    .maybeSingle();

  await supabase.from(RESPONSES_TABLE).delete().eq("questionnaire_id", id);
  const { error } = await supabase.from(QUESTIONNAIRES_TABLE).delete().eq("id", id);
  if (error) redirect(`${QUESTIONNAIRES_PATH}?error=${encodeURIComponent(error.message)}`);

  await logHRActivity({
    actor_id: user.id,
    actor_name: user.name || user.email || "HR user",
    action: "html_interview_questionnaire_permanently_deleted",
    entity_type: "hr_interview_questionnaire",
    entity_id: id,
    title: `Permanently deleted HTML interview questionnaire: ${existing?.title || id}`,
    metadata: { public_slug: existing?.public_slug, permanent_delete: true },
  });

  revalidatePath(QUESTIONNAIRES_PATH);
  revalidatePath(`${QUESTIONNAIRES_PATH}/${id}`);
  redirect(`${QUESTIONNAIRES_PATH}?deleted=1`);
}

