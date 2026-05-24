"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { HR_TABLES, logHRActivity } from "@/lib/hr-production/repository";

const text = (fd: FormData, key: string, fallback = "") =>
  String(fd.get(key) || fallback).trim();
const num = (fd: FormData, key: string, fallback = 0) => {
  const n = Number(fd.get(key) || fallback);
  return Number.isFinite(n) ? n : fallback;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const parseHourTo24 = (value: string, fallback = "09:00") => {
  const raw = String(value || "").trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return fallback;
  let h = Number(match[1]);
  const m = match[2] || "00";
  const ap = match[3].toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${pad2(h)}:${m}`;
};
const normalizeInterviewDateTime = (formData: FormData) => {
  const raw = text(formData, "interview_date");
  const selectedDate = text(formData, "selected_date");
  const selectedTime = text(formData, "selected_time");
  let date = selectedDate || new Date().toISOString().slice(0, 10);
  let time = parseHourTo24(selectedTime, "09:00");

  if (raw) {
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/);
    if (m?.[1]) date = m[1];
    if (m?.[2]) time = m[2];
  }

  const local = `${date}T${time}:00`;
  const casablancaTz = `${local}+01:00`;
  return { date, time, local, casablancaTz };
};

const clean = (row: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(row).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== "",
    ),
  );

async function actor() {
  return requireRole(["ceo", "manager", "ops_admin", "hr", "coordinator"]);
}

export async function createRecruitmentTask(formData: FormData) {
  const user = await actor();
  const supabase = await createClient();
  const payload = clean({
    task_type: text(formData, "task_type", "recruitment"),
    title: text(formData, "title"),
    owner: text(formData, "owner"),
    priority: text(formData, "priority", "medium"),
    status: text(formData, "status", "open"),
    due_date: text(formData, "due_date") || null,
    related_module: "recruitment",
    related_record_id: text(formData, "related_record_id") || null,
    description: text(formData, "description"),
    outcome: text(formData, "outcome"),
  });
  const { data, error } = await supabase
    .from(HR_TABLES.tasks)
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await logHRActivity({
    actor_user_id: user?.id,
    actor_label: user?.full_name || user?.email || user?.role,
    source_table: HR_TABLES.tasks,
    record_id: data?.id,
    action: "recruitment_task_created",
    details: payload,
  });
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/recruitment/interviews");
}

export async function addRecruitmentComment(formData: FormData) {
  const user = await actor();
  const details = clean({
    comment: text(formData, "comment"),
    visibility: text(formData, "visibility", "internal"),
    sentiment: text(formData, "sentiment", "neutral"),
    next_step: text(formData, "next_step"),
    mention: text(formData, "mention"),
  });
  await logHRActivity({
    actor_user_id: user?.id,
    actor_label: user?.full_name || user?.email || user?.role,
    source_table: text(formData, "source_table", HR_TABLES.candidates),
    record_id: text(formData, "record_id") || null,
    action: "recruitment_comment_added",
    module: "recruitment",
    details,
  });
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/recruitment/interviews");
}

export async function scheduleRecruitmentInterview(formData: FormData) {
  const user = await actor();
  const supabase = await createClient();
  const candidateId = text(formData, "candidate_id");
  const slot = normalizeInterviewDateTime(formData);
  const owner = text(formData, "owner") || text(formData, "selected_interviewer") || "Recruitment";
  const payload = clean({
    full_name: text(formData, "full_name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    city: text(formData, "city"),
    desired_position: text(formData, "desired_position"),
    pipeline_stage: text(formData, "pipeline_stage", "interview"),
    source: text(formData, "interview_type", "HR Interview"),
    interview_date: slot.date,
    interview_time: slot.time,
    interview_datetime: slot.casablancaTz,
    scheduled_at: slot.casablancaTz,
    score: num(formData, "score", 0),
    expected_salary: num(formData, "expected_salary", 0),
    notes: text(formData, "notes"),
    decision: text(formData, "decision", "pending"),
    owner,
    interviewer: owner,
    meeting_url: text(formData, "meeting_url"),
  });

  const fallbackPayload = clean({
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    city: payload.city,
    desired_position: payload.desired_position,
    pipeline_stage: payload.pipeline_stage,
    source: payload.source,
    interview_date: payload.interview_date,
    score: payload.score,
    expected_salary: payload.expected_salary,
    notes: [
      payload.notes,
      `Interview time: ${slot.time}`,
      owner ? `Lead interviewer: ${owner}` : "",
      payload.meeting_url ? `Meeting: ${payload.meeting_url}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    decision: payload.decision,
  });

  let recordId = candidateId;
  if (candidateId) {
    const first = await supabase
      .from(HR_TABLES.candidates)
      .update(payload)
      .eq("id", candidateId);
    if (first.error) {
      const retry = await supabase
        .from(HR_TABLES.candidates)
        .update(fallbackPayload)
        .eq("id", candidateId);
      if (retry.error) throw new Error(retry.error.message);
    }
  } else {
    const first = await supabase
      .from(HR_TABLES.candidates)
      .insert(payload)
      .select("id")
      .single();
    if (first.error) {
      const retry = await supabase
        .from(HR_TABLES.candidates)
        .insert(fallbackPayload)
        .select("id")
        .single();
      if (retry.error) throw new Error(retry.error.message);
      recordId = retry.data?.id;
    } else {
      recordId = first.data?.id;
    }
  }

  const taskTitle =
    text(formData, "task_title") ||
    `Prepare interview: ${payload.full_name || "Candidate"}`;
  await supabase.from(HR_TABLES.tasks).insert(
    clean({
      task_type: "interview_preparation",
      title: taskTitle,
      owner,
      priority: text(formData, "priority", "high"),
      status: "open",
      due_date: slot.date || null,
      related_module: "recruitment_interviews",
      related_record_id: recordId || null,
      description: text(formData, "notes"),
    }),
  );

  await logHRActivity({
    actor_user_id: user?.id,
    actor_label: user?.full_name || user?.email || user?.role,
    source_table: HR_TABLES.candidates,
    record_id: recordId,
    action: "interview_scheduled",
    module: "recruitment",
    details: payload,
  });
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/recruitment/interviews");
}

export async function quickCandidateDecision(formData: FormData) {
  const user = await actor();
  const supabase = await createClient();
  const id = text(formData, "candidate_id");
  const pipeline_stage = text(formData, "pipeline_stage");
  const decision = text(formData, "decision");
  const payload = clean({
    pipeline_stage,
    decision,
    notes: text(formData, "notes"),
  });
  const { error } = await supabase
    .from(HR_TABLES.candidates)
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logHRActivity({
    actor_user_id: user?.id,
    actor_label: user?.full_name || user?.email || user?.role,
    source_table: HR_TABLES.candidates,
    record_id: id,
    action: "candidate_decision_updated",
    module: "recruitment",
    details: payload,
  });
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/recruitment/interviews");
}

export async function deleteRecruitmentInterview(formData: FormData) {
  const user = await actor();
  const supabase = await createClient();
  const id = text(formData, "candidate_id");
  if (!id) throw new Error("Missing candidate id");
  const payload = clean({
    interview_date: null,
    meeting_url: null,
    video_url: null,
    pipeline_stage: text(formData, "pipeline_stage", "screening"),
    decision: text(formData, "decision", "pending"),
    notes: text(formData, "notes", "Interview removed from calendar"),
  });
  const first = await supabase.from(HR_TABLES.candidates).update(payload).eq("id", id);
  if (first.error) {
    const fallback = clean({
      interview_date: null,
      pipeline_stage: text(formData, "pipeline_stage", "screening"),
      decision: text(formData, "decision", "pending"),
      notes: text(formData, "notes", "Interview removed from calendar"),
    });
    const retry = await supabase.from(HR_TABLES.candidates).update(fallback).eq("id", id);
    if (retry.error) throw new Error(retry.error.message);
  }
  await logHRActivity({
    actor_user_id: user?.id,
    actor_label: user?.full_name || user?.email || user?.role,
    source_table: HR_TABLES.candidates,
    record_id: id,
    action: "interview_deleted",
    module: "recruitment",
    details: payload,
  });
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/recruitment/interviews");
}

export async function scheduleCandidateInterview(formData: FormData) {
  return scheduleRecruitmentInterview(formData);
}
