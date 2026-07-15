"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const QUESTIONNAIRES_TABLE = "hr_interview_questionnaires";
const RESPONSES_TABLE = "hr_interview_questionnaire_responses";

const technicalKeys = new Set([
  "questionnaire_id",
  "slug",
  "candidate_name",
  "candidate_email",
  "candidate_phone",
  "city",
  "desired_position",
  "candidate_consent",
  "total_score",
]);

function text(fd: FormData, key: string, fallback = "") {
  return String(fd.get(key) || fallback).trim();
}

function collectAnswers(fd: FormData) {
  const grouped = new Map<string, FormDataEntryValue[]>();
  for (const [key, value] of fd.entries()) {
    if (technicalKeys.has(key)) continue;
    if (!key || key.startsWith("$ACTION_")) continue;
    const existing = grouped.get(key) || [];
    existing.push(value);
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries()).map(([field, values]) => ({
    field,
    value: values.length === 1 ? String(values[0]) : values.map((value) => String(value)),
  }));
}

export async function submitInterviewAssessment(fd: FormData) {
  const questionnaireId = text(fd, "questionnaire_id");
  const slug = text(fd, "slug");
  const candidateName = text(fd, "candidate_name");

  if (!questionnaireId || !slug || !candidateName) redirect(`/assessments/interview/${slug || "missing"}?error=missing_required`);

  const supabase = await createClient();
  const { data: questionnaire } = await supabase
    .from(QUESTIONNAIRES_TABLE)
    .select("id,title,allow_multiple_submissions,status,is_public")
    .eq("id", questionnaireId)
    .maybeSingle();

  if (!questionnaire || questionnaire.status === "archived" || !questionnaire.is_public) {
    redirect(`/assessments/interview/${slug}?error=closed`);
  }

  if (!questionnaire.allow_multiple_submissions) {
    const email = text(fd, "candidate_email");
    if (email) {
      const { data: existing } = await supabase
        .from(RESPONSES_TABLE)
        .select("id")
        .eq("questionnaire_id", questionnaireId)
        .eq("candidate_email", email)
        .limit(1);
      if (Array.isArray(existing) && existing.length) redirect(`/assessments/interview/${slug}?submitted=1&duplicate=1`);
    }
  }

  const totalScore = Number(text(fd, "total_score", "0"));
  const answers = collectAnswers(fd);

  const { error } = await supabase.from(RESPONSES_TABLE).insert({
    questionnaire_id: questionnaireId,
    candidate_name: candidateName,
    candidate_email: text(fd, "candidate_email"),
    candidate_phone: text(fd, "candidate_phone"),
    city: text(fd, "city"),
    desired_position: text(fd, "desired_position"),
    candidate_consent: ["1", "true", "yes", "on"].includes(text(fd, "candidate_consent").toLowerCase()),
    total_score: Number.isFinite(totalScore) ? totalScore : 0,
    answers,
    status: "submitted",
    metadata: {
      source: "public_html_interview_assessment",
      answer_fields_count: answers.length,
      submitted_via: slug,
    },
  });

  if (error) redirect(`/assessments/interview/${slug}?error=${encodeURIComponent(error.message)}`);
  redirect(`/assessments/interview/${slug}?submitted=1`);
}
