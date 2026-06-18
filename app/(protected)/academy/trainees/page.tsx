import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/auth/requireAccess";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

type Trainee = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  status?: string | null;
  lifecycle_status?: string | null;
  eligibility_status?: string | null;
  readiness_score?: number | null;
  compliance_score?: number | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
};

type Enrollment = {
  id: string;
  trainee_id?: string | null;
  course_id?: string | null;
  group_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  progress?: number | null;
  completion_rate?: number | null;
  created_at?: string | null;
  metadata?: Record<string, any> | null;
};
type Payment = {
  id: string;
  trainee_id?: string | null;
  amount?: number | null;
  amount_mad?: number | null;
  status?: string | null;
  created_at?: string | null;
  metadata?: Record<string, any> | null;
};
type Attendance = {
  id: string;
  trainee_id?: string | null;
  status?: string | null;
  attendance_status?: string | null;
  created_at?: string | null;
  metadata?: Record<string, any> | null;
};
type Certificate = {
  id: string;
  trainee_id?: string | null;
  status?: string | null;
  certificate_status?: string | null;
  issued_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, any> | null;
};
type Course = {
  id: string;
  title?: string | null;
  category?: string | null;
  level?: string | null;
  duration_hours?: number | null;
  price?: number | null;
  status?: string | null;
};
type Group = {
  id: string;
  name?: string | null;
  course_id?: string | null;
  trainer_id?: string | null;
  location_id?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  max_capacity?: number | null;
};
type Location = {
  id: string;
  name?: string | null;
  city?: string | null;
  address?: string | null;
  capacity?: number | null;
  status?: string | null;
};
type Trainer = {
  id: string;
  full_name?: string | null;
  specialty?: string | null;
  status?: string | null;
  workload_score?: number | null;
};

const sidebarItems = [
  { label: "Command Center", href: "/academy", icon: "⌂", group: "academy" },
  {
    label: "Trainees",
    href: "/academy/trainees",
    icon: "👥",
    group: "academy",
  },
  {
    label: "Enrollments",
    href: "/academy/enrollments",
    icon: "▣",
    group: "academy",
  },
  {
    label: "Attendance",
    href: "/academy/attendance",
    icon: "☑",
    group: "academy",
  },
  { label: "Payments", href: "/academy/payments", icon: "▤", group: "academy" },
  {
    label: "Certificates",
    href: "/academy/certificates",
    icon: "◎",
    group: "academy",
  },
  { label: "Trainers", href: "/academy/trainers", icon: "♙", group: "academy" },
  { label: "Programs", href: "/academy/courses", icon: "▦", group: "academy" },
  {
    label: "Job Placement",
    href: "/academy/job-placement",
    icon: "▱",
    group: "academy",
  },
  {
    label: "Partners & Employers",
    href: "/academy/partners",
    icon: "♧",
    group: "academy",
  },
  {
    label: "Announcements",
    href: "/academy/alerts-sales",
    icon: "◁",
    group: "academy",
  },
  {
    label: "Reports & Analytics",
    href: "/academy/reports",
    icon: "⌁",
    group: "academy",
  },
  {
    label: "Integrations",
    href: "/academy/integrations",
    icon: "⚙",
    group: "system",
  },
  {
    label: "Automation",
    href: "/academy/automation",
    icon: "◇",
    group: "system",
  },
  { label: "Settings", href: "/academy/settings", icon: "⚙", group: "system" },
];

const quickActions = [
  {
    label: "New Trainee",
    href: "/academy/trainees?create=1",
    icon: "👥",
    color: "#355df6",
  },
  {
    label: "Validate Eligibility",
    href: "/academy/eligibility",
    icon: "🛡️",
    color: "#f97316",
  },
  {
    label: "Enroll Candidate",
    href: "/academy/enrollments",
    icon: "🎓",
    color: "#7c3aed",
  },
  {
    label: "Add Payment",
    href: "/academy/payments",
    icon: "💳",
    color: "#16a34a",
  },
  {
    label: "Issue Certificate",
    href: "/academy/certificates",
    icon: "🏅",
    color: "#0891b2",
  },
];

async function safeTable<T = any>(
  supabase: any,
  table: string,
  select: string,
  limit = 500,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

function n(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}
function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}
function money(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${Math.round(value)}`;
}
function date(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-MA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
function labelOf(t: Trainee) {
  return (
    t.full_name ||
    t.name ||
    t.email ||
    t.phone ||
    `Trainee ${String(t.id).slice(0, 8)}`
  );
}
function statusOf(t: Trainee) {
  return String(t.lifecycle_status || t.status || "new").toLowerCase();
}
function eligibilityOf(t: Trainee) {
  return String(
    t.eligibility_status || t.metadata?.eligibility_status || "pending",
  ).toLowerCase();
}
function scoreOf(t: Trainee) {
  return Math.max(
    n(t.readiness_score || t.metadata?.readiness_score),
    n(t.compliance_score || t.metadata?.compliance_score),
  );
}
function paymentAmount(p: Payment) {
  return n(p.amount_mad ?? p.amount);
}

function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e7ecf4",
        borderRadius: 24,
        boxShadow: "0 18px 45px rgba(15,23,42,.045)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}
function MiniIcon({
  children,
  color = "#355df6",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        width: 42,
        height: 42,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        background: `${color}16`,
        color,
        fontSize: 18,
        boxShadow: `inset 0 0 0 1px ${color}18`,
      }}
    >
      {children}
    </span>
  );
}
function Kpi({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <MiniIcon color={color}>{icon}</MiniIcon>
        <div>
          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            {label}
          </p>
          <strong
            style={{
              display: "block",
              marginTop: 5,
              color: "#0f172a",
              fontSize: 27,
              letterSpacing: "-.05em",
            }}
          >
            {value}
          </strong>
          <p
            style={{
              margin: "4px 0 0",
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {sub}
          </p>
        </div>
      </div>
    </Card>
  );
}
function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "orange" | "rose" | "purple" | "slate";
}) {
  const palette = {
    blue: ["#dbeafe", "#2563eb", "#bfdbfe"],
    green: ["#dcfce7", "#16a34a", "#bbf7d0"],
    orange: ["#ffedd5", "#ea580c", "#fed7aa"],
    rose: ["#fee2e2", "#e11d48", "#fecdd3"],
    purple: ["#ede9fe", "#7c3aed", "#ddd6fe"],
    slate: ["#f1f5f9", "#64748b", "#e2e8f0"],
  }[tone];
  return (
    <span
      style={{
        border: `1px solid ${palette[2]}`,
        background: palette[0],
        color: palette[1],
        borderRadius: 999,
        padding: "5px 9px",
        fontSize: 10,
        fontWeight: 950,
        textTransform: "uppercase",
        letterSpacing: ".04em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
function Meter({
  value,
  color = "#355df6",
}: {
  value: number;
  color?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      style={{
        height: 9,
        borderRadius: 999,
        background: "#eef2f7",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${safe}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  );
}
function Ring({ value, color = "#355df6" }: { value: number; color?: string }) {
  const deg = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div
      style={{
        width: 150,
        height: 150,
        borderRadius: "50%",
        background: `conic-gradient(${color} 0 ${deg}deg,#eef2f7 ${deg}deg 360deg)`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: 106,
          height: 106,
          borderRadius: "50%",
          background: "#fff",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <strong style={{ fontSize: 28, letterSpacing: "-.05em" }}>
          {value}%
        </strong>
        <span
          style={{
            marginTop: -20,
            color: "#64748b",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          ready
        </span>
      </div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #eef2f7",
        borderRadius: 16,
        padding: 14,
        background: "#fbfdff",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
          fontSize: 11,
          fontWeight: 950,
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {label}
      </p>
      <strong
        style={{
          display: "block",
          marginTop: 7,
          color: "#0f172a",
          fontSize: 14,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </strong>
    </div>
  );
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "13px 14px",
    fontWeight: 850,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  };
}
function labelStyle(): CSSProperties {
  return {
    display: "grid",
    gap: 8,
    color: "#475569",
    fontSize: 11,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: ".06em",
  };
}
function clean(value: FormDataEntryValue | null) {
  const v = String(value || "").trim();
  return v.length ? v : null;
}
function cleanNumber(value: FormDataEntryValue | null) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

async function createTraineeDossierAction(formData: FormData) {
  "use server";
  await requireAccess("academy.view");
  const supabase = await createClient();
  const fullName = clean(formData.get("full_name"));
  if (!fullName) throw new Error("Full name is required");
  const courseId = clean(formData.get("course_id"));
  const groupId = clean(formData.get("group_id"));
  const trainerId = clean(formData.get("trainer_id"));
  const locationId = clean(formData.get("location_id"));
  const initialPayment = cleanNumber(formData.get("initial_payment"));
  const metadata = {
    created_from: "academy_trainees_live_modal",
    professional_background: clean(formData.get("professional_background")),
    education_level: clean(formData.get("education_level")),
    experience_level: clean(formData.get("experience_level")),
    preferred_course_id: courseId,
    preferred_group_id: groupId,
    preferred_trainer_id: trainerId,
    preferred_location_id: locationId,
    schedule_preference: clean(formData.get("schedule_preference")),
    placement_goal: clean(formData.get("placement_goal")),
    emergency_contact: clean(formData.get("emergency_contact")),
    national_id: clean(formData.get("national_id")),
    compliance_note: clean(formData.get("compliance_note")),
  };
  const { data, error } = await supabase
    .from("academy_trainees")
    .insert({
      full_name: fullName,
      phone: clean(formData.get("phone")),
      email: clean(formData.get("email")),
      city: clean(formData.get("city")),
      source: clean(formData.get("source")) || "academy_frontdesk",
      status: clean(formData.get("status")) || "prospect",
      eligibility_status:
        clean(formData.get("eligibility_status")) || "pending",
      eligibility_score: cleanNumber(formData.get("eligibility_score")),
      assigned_group_id: groupId,
      notes: clean(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const traineeId = data?.id;
  if (traineeId && (courseId || groupId)) {
    await supabase.from("academy_enrollments").insert({
      trainee_id: traineeId,
      course_id: courseId,
      group_id: groupId,
      status: clean(formData.get("enrollment_status")) || "pending",
      note: clean(formData.get("enrollment_note")),
      metadata: {
        created_from: "academy_trainees_live_modal",
        trainer_id: trainerId,
        location_id: locationId,
      },
    });
  }
  if (traineeId && initialPayment > 0) {
    await supabase.from("academy_payments").insert({
      trainee_id: traineeId,
      amount: initialPayment,
      method: clean(formData.get("payment_method")) || "cash",
      status: clean(formData.get("payment_status")) || "pending",
      reference: clean(formData.get("payment_reference")),
      metadata: { created_from: "academy_trainees_live_modal" },
    });
  }
  if (traineeId) {
    await supabase.from("academy_audit_logs").insert({
      action: "created_from_trainees_modal",
      entity: "academy_trainee",
      entity_id: traineeId,
      note: `Trainee dossier created: ${fullName}`,
      metadata: {
        course_id: courseId,
        group_id: groupId,
        initial_payment: initialPayment,
      },
    });
  }
  revalidatePath("/academy/trainees");
  redirect(`/academy/trainees?open=${traineeId}`);
}

async function updateTraineeDossierAction(formData: FormData) {
  "use server";
  await requireAccess("academy.view");
  const supabase = await createClient();
  const traineeId = clean(formData.get("trainee_id"));
  if (!traineeId) throw new Error("Missing trainee id");
  const fullName = clean(formData.get("full_name"));
  if (!fullName) throw new Error("Full name is required");
  const courseId = clean(formData.get("course_id"));
  const groupId = clean(formData.get("group_id"));
  const trainerId = clean(formData.get("trainer_id"));
  const locationId = clean(formData.get("location_id"));
  const paymentAmountValue = cleanNumber(formData.get("initial_payment"));
  const metadata = {
    updated_from: "academy_trainees_live_edit_modal",
    emergency_contact: clean(formData.get("emergency_contact")),
    national_id: clean(formData.get("national_id")),
    education_level: clean(formData.get("education_level")),
    experience_level: clean(formData.get("experience_level")),
    professional_background: clean(formData.get("professional_background")),
    compliance_note: clean(formData.get("compliance_note")),
    schedule_preference: clean(formData.get("schedule_preference")),
    placement_goal: clean(formData.get("placement_goal")),
    location_id: locationId,
    trainer_id: trainerId,
    course_id: courseId,
    group_id: groupId,
    payment_reference: clean(formData.get("payment_reference")),
    payment_method: clean(formData.get("payment_method")),
    last_live_edit_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("academy_trainees")
    .update({
      full_name: fullName,
      phone: clean(formData.get("phone")),
      email: clean(formData.get("email")),
      city: clean(formData.get("city")),
      source: clean(formData.get("source")) || "academy_frontdesk",
      status: clean(formData.get("status")) || "prospect",
      eligibility_status:
        clean(formData.get("eligibility_status")) || "pending",
      eligibility_score: cleanNumber(formData.get("eligibility_score")),
      readiness_score: cleanNumber(formData.get("readiness_score")),
      compliance_score: cleanNumber(formData.get("compliance_score")),
      assigned_group_id: groupId,
      notes: clean(formData.get("notes")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", traineeId);
  if (error) throw new Error(error.message);

  if (courseId || groupId) {
    const enrollmentStatus = clean(formData.get("enrollment_status")) || "enrolled";
    const enrollmentNote = clean(formData.get("enrollment_note"));
    const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
      .from("academy_enrollments")
      .select("id")
      .eq("trainee_id", traineeId)
      .in("status", ["pending", "enrolled", "active", "ongoing", "on_hold"])
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (existingEnrollmentError) throw new Error(existingEnrollmentError.message);

    const enrollmentPayload = {
      trainee_id: traineeId,
      course_id: courseId,
      group_id: groupId,
      status: enrollmentStatus,
      note: enrollmentNote,
      updated_at: new Date().toISOString(),
      metadata: {
        updated_from: "academy_trainees_live_edit_modal",
        trainer_id: trainerId,
        location_id: locationId,
        schedule_preference: clean(formData.get("schedule_preference")),
      },
    };

    const enrollmentWrite = existingEnrollment?.id
      ? await supabase
          .from("academy_enrollments")
          .update(enrollmentPayload)
          .eq("id", existingEnrollment.id)
      : await supabase.from("academy_enrollments").insert(enrollmentPayload);
    if (enrollmentWrite.error) throw new Error(enrollmentWrite.error.message);
  }
  if (paymentAmountValue > 0) {
    const paymentReference =
      clean(formData.get("payment_reference")) || `TRAINEE-${traineeId}-INITIAL`;
    const paymentPayload = {
      trainee_id: traineeId,
      amount: paymentAmountValue,
      method: clean(formData.get("payment_method")) || "cash",
      status: clean(formData.get("payment_status")) || "pending",
      reference: paymentReference,
      updated_at: new Date().toISOString(),
      metadata: { updated_from: "academy_trainees_live_edit_modal" },
    };
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("academy_payments")
      .select("id")
      .eq("trainee_id", traineeId)
      .eq("reference", paymentReference)
      .limit(1)
      .maybeSingle();
    if (existingPaymentError) throw new Error(existingPaymentError.message);

    const paymentWrite = existingPayment?.id
      ? await supabase
          .from("academy_payments")
          .update(paymentPayload)
          .eq("id", existingPayment.id)
      : await supabase.from("academy_payments").insert(paymentPayload);
    if (paymentWrite.error) throw new Error(paymentWrite.error.message);
  }
  await supabase.from("academy_audit_logs").insert({
    action: "updated_from_trainees_modal",
    entity: "academy_trainee",
    entity_id: traineeId,
    note: `Trainee dossier updated: ${fullName}`,
    metadata: {
      course_id: courseId,
      group_id: groupId,
      payment_amount: paymentAmountValue,
    },
  });
  revalidatePath("/academy/trainees");
  redirect(`/academy/trainees?open=${traineeId}`);
}

async function deleteTraineeDossierAction(formData: FormData) {
  "use server";
  await requireAccess("academy.manage");
  const supabase = await createClient();
  const traineeId = clean(formData.get("trainee_id"));
  const label = clean(formData.get("trainee_label")) || traineeId;
  if (!traineeId) throw new Error("Missing trainee id");

  const deletionStartedAt = new Date().toISOString();

  const deleteByTraineeId = async (table: string) => {
    const { error } = await supabase.from(table).delete().eq("trainee_id", traineeId);
    if (error) throw new Error(`${table}: ${error.message}`);
  };

  const deleteByEntityId = async (table: string, extra?: Record<string, string>) => {
    let query = supabase.from(table).delete().eq("entity_id", traineeId);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) query = query.eq(key, value);
    }
    const { error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
  };

  // Delete dependent Academy records first, then delete the trainee dossier itself.
  // This is intentionally a hard delete, not a status update / soft delete.
  await deleteByTraineeId("academy_evaluations");
  await deleteByTraineeId("academy_certificates");
  await deleteByTraineeId("academy_attendance");
  await deleteByTraineeId("academy_payments");
  await deleteByTraineeId("academy_enrollments");
  await deleteByTraineeId("academy_graduation_followups");

  await supabase.from("academy_alerts").delete().eq("trainee_id", traineeId);
  await deleteByEntityId("academy_document_exports");
  await deleteByEntityId("academy_notification_queue");
  await supabase.from("academy_command_records").delete().eq("source_entity_id", traineeId);
  await deleteByEntityId("academy_integration_events");
  await supabase.from("academy_audit_logs").delete().eq("entity_id", traineeId);

  const { error: traineeError } = await supabase.from("academy_trainees").delete().eq("id", traineeId);
  if (traineeError) throw new Error(`academy_trainees: ${traineeError.message}`);

  await supabase.from("academy_audit_logs").insert({
    action: "hard_deleted_from_trainees_modal",
    entity: "academy_trainee_deletion",
    note: `Trainee dossier permanently deleted from Academy: ${label}`,
    metadata: {
      deleted_trainee_id: traineeId,
      deleted_at: deletionStartedAt,
      deleted_from: "academy_trainees_live_edit_modal",
    },
  });

  revalidatePath("/academy");
  revalidatePath("/academy/trainees");
  revalidatePath("/academy/enrollments");
  revalidatePath("/academy/payments");
  revalidatePath("/academy/attendance");
  revalidatePath("/academy/certificates");
  revalidatePath("/academy/graduation");
  revalidatePath("/academy/job-placement");
  redirect("/academy/trainees");
}

function NewTraineeDossierModal({
  courses,
  groups,
  locations,
  trainers,
}: {
  courses: Course[];
  groups: Group[];
  locations: Location[];
  trainers: Trainer[];
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(15,23,42,.42)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        action={createTraineeDossierAction}
        style={{
          width: "min(1240px,96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 32,
          border: "1px solid #e2e8f0",
          boxShadow: "0 35px 110px rgba(15,23,42,.28)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            background: "linear-gradient(180deg,#fff,#f8fafc)",
            borderBottom: "1px solid #e7ecf4",
            padding: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
            <MiniIcon color="#355df6">👥</MiniIcon>
            <div>
              <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-.06em" }}>
                Create Live Trainee Dossier
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 850,
                }}
              >
                Synced with courses, groups, locations, trainers, enrollments,
                payments and audit logs.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/academy/trainees"
              scroll={false}
              style={{
                textDecoration: "none",
                borderRadius: 14,
                padding: "13px 18px",
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #dbe3ef",
                fontWeight: 950,
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              style={{
                border: 0,
                borderRadius: 14,
                padding: "13px 22px",
                background: "#355df6",
                color: "#fff",
                fontWeight: 950,
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(53,93,246,.25)",
              }}
            >
              Save dossier
            </button>
          </div>
        </div>
        <div style={{ padding: 22, display: "grid", gap: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,minmax(0,1fr))",
              gap: 14,
            }}
          >
            <Kpi
              icon="📚"
              label="Courses"
              value={String(courses.length)}
              sub="live academy_courses"
              color="#355df6"
            />
            <Kpi
              icon="▣"
              label="Groups"
              value={String(groups.length)}
              sub="live academy_groups"
              color="#7c3aed"
            />
            <Kpi
              icon="📍"
              label="Locations"
              value={String(locations.length)}
              sub="live academy_locations"
              color="#0891b2"
            />
            <Kpi
              icon="♙"
              label="Trainers"
              value={String(trainers.length)}
              sub="live academy_trainers"
              color="#16a34a"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: 18,
            }}
          >
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Personal Information</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Identity, contact and source of the candidate.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label style={labelStyle()}>
                  Full name
                  <input
                    name="full_name"
                    required
                    placeholder="Full trainee name"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Phone
                  <input
                    name="phone"
                    placeholder="06..."
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Email
                  <input
                    name="email"
                    type="email"
                    placeholder="name@email.com"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  City
                  <input
                    name="city"
                    placeholder="Rabat / Temara / Bouznika"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Source
                  <select
                    name="source"
                    defaultValue="whatsapp"
                    style={inputStyle()}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="academy_campaign">Academy campaign</option>
                    <option value="partner_referral">Partner referral</option>
                    <option value="ambassador_referral">
                      Ambassador referral
                    </option>
                    <option value="website">Website</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Emergency contact
                  <input
                    name="emergency_contact"
                    placeholder="Name + phone"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  National ID
                  <input
                    name="national_id"
                    placeholder="CIN / ID reference"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Initial status
                  <select
                    name="status"
                    defaultValue="prospect"
                    style={inputStyle()}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active file</option>
                    <option value="approved">Approved</option>
                    <option value="in_training">In training</option>
                  </select>
                </label>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>
                Background & Eligibility
              </h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Professional, education and compliance readiness.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label style={labelStyle()}>
                  Education level
                  <select
                    name="education_level"
                    defaultValue=""
                    style={inputStyle()}
                  >
                    <option value="">Select</option>
                    <option>Bac</option>
                    <option>Bac+2</option>
                    <option>Bac+3</option>
                    <option>Professional certificate</option>
                    <option>Experience based</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Experience level
                  <select
                    name="experience_level"
                    defaultValue="starter"
                    style={inputStyle()}
                  >
                    <option value="starter">Starter</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Eligibility
                  <select
                    name="eligibility_status"
                    defaultValue="pending"
                    style={inputStyle()}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="missing_info">Missing information</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Eligibility score
                  <input
                    name="eligibility_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="0"
                    style={inputStyle()}
                  />
                </label>
                <label style={{ ...labelStyle(), gridColumn: "1 / -1" }}>
                  Professional background
                  <textarea
                    name="professional_background"
                    rows={4}
                    placeholder="Previous childcare, nursery, preschool, event, nanny or education experience..."
                    style={{ ...inputStyle(), resize: "vertical" }}
                  />
                </label>
                <label style={{ ...labelStyle(), gridColumn: "1 / -1" }}>
                  Compliance note
                  <textarea
                    name="compliance_note"
                    rows={3}
                    placeholder="Missing documents, interview notes, behavior, verification status..."
                    style={{ ...inputStyle(), resize: "vertical" }}
                  />
                </label>
              </div>
            </Card>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 18,
            }}
          >
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Course & Group Sync</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Optional immediate enrollment bridge.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle()}>
                  Course
                  <select name="course_id" defaultValue="" style={inputStyle()}>
                    <option value="">No course yet</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.id} {c.level ? `• ${c.level}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Group
                  <select name="group_id" defaultValue="" style={inputStyle()}>
                    <option value="">No group yet</option>
                    {groups.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name || g.id} {g.status ? `• ${g.status}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Enrollment status
                  <select
                    name="enrollment_status"
                    defaultValue="pending"
                    style={inputStyle()}
                  >
                    <option value="pending">Pending</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="waiting_list">Waiting list</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Schedule preference
                  <input
                    name="schedule_preference"
                    placeholder="Morning / evening / weekend"
                    style={inputStyle()}
                  />
                </label>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Location & Trainer</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Operational assignment signals.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle()}>
                  Training location
                  <select
                    name="location_id"
                    defaultValue=""
                    style={inputStyle()}
                  >
                    <option value="">No location yet</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.name || l.id} {l.city ? `• ${l.city}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Trainer
                  <select
                    name="trainer_id"
                    defaultValue=""
                    style={inputStyle()}
                  >
                    <option value="">No trainer yet</option>
                    {trainers.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.id}{" "}
                        {t.specialty ? `• ${t.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Placement goal
                  <select
                    name="placement_goal"
                    defaultValue="home_nanny"
                    style={inputStyle()}
                  >
                    <option value="home_nanny">Home nanny</option>
                    <option value="preschool_assistant">
                      Preschool assistant
                    </option>
                    <option value="event_kids_leader">Event kids leader</option>
                    <option value="nursery_support">Nursery support</option>
                    <option value="partner_staffing">Partner staffing</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Enrollment note
                  <input
                    name="enrollment_note"
                    placeholder="Manager instruction for group/course assignment"
                    style={inputStyle()}
                  />
                </label>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Payment & Notes</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Optional initial ledger creation.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle()}>
                  Initial payment MAD
                  <input
                    name="initial_payment"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Payment status
                  <select
                    name="payment_status"
                    defaultValue="pending"
                    style={inputStyle()}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="validated">Validated</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Payment method
                  <select
                    name="payment_method"
                    defaultValue="cash"
                    style={inputStyle()}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile money</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Payment reference
                  <input
                    name="payment_reference"
                    placeholder="Receipt / transaction reference"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Manager notes
                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Anything the Academy team must know before validation, enrollment, payment or placement..."
                    style={{ ...inputStyle(), resize: "vertical" }}
                  />
                </label>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

function Sidebar() {
  return (
    <aside
      style={{
        width: 260,
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "1px solid #e7ecf4",
        background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(18px)",
        padding: 22,
      }}
    >
      <Link
        href="/academy"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          textDecoration: "none",
          color: "#0f172a",
          marginBottom: 34,
        }}
      >
        <span style={{ fontSize: 34 }}>🎓</span>
        <div>
          <strong
            style={{ display: "block", fontSize: 20, letterSpacing: "-.04em" }}
          >
            Academy OS
          </strong>
          <span style={{ color: "#475569", fontWeight: 800, fontSize: 13 }}>
            Trainees Center
          </span>
        </div>
      </Link>
      <p
        style={{
          margin: "0 0 12px 2px",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 950,
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        Academy
      </p>
      <nav style={{ display: "grid", gap: 6 }}>
        {sidebarItems
          .filter((i: any) => i.group === "academy")
          .map((item: any) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                gap: 13,
                alignItems: "center",
                padding: "13px 14px",
                borderRadius: 15,
                textDecoration: "none",
                color:
                  item.href === "/academy/trainees" ? "#1d4ed8" : "#0f172a",
                background:
                  item.href === "/academy/trainees" ? "#eef2ff" : "transparent",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
      </nav>
      <p
        style={{
          margin: "28px 0 12px 2px",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 950,
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        System
      </p>
      <nav style={{ display: "grid", gap: 6 }}>
        {sidebarItems
          .filter((i: any) => i.group === "system")
          .map((item: any) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                gap: 13,
                alignItems: "center",
                padding: "13px 14px",
                borderRadius: 15,
                textDecoration: "none",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
      </nav>
      <Card
        style={{
          marginTop: 28,
          padding: 16,
          background: "linear-gradient(180deg,#fff,#f8fafc)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <MiniIcon>👥</MiniIcon>
          <div>
            <strong style={{ display: "block" }}>Trainees OS</strong>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 800 }}>
              Live Sync
            </span>
          </div>
        </div>
        <p style={{ color: "#16a34a", fontSize: 12, fontWeight: 950 }}>
          ● Online
        </p>
        <p
          style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 800 }}
        >
          Synced with enrollments, payments, attendance and certificates.
        </p>
      </Card>
    </aside>
  );
}

function traineeMeta(trainee: Trainee, key: string) {
  return trainee.metadata && typeof trainee.metadata === "object"
    ? (trainee.metadata as Record<string, any>)[key]
    : null;
}

function EditableTraineeDossierModal({
  trainee,
  enrollments,
  payments,
  attendance,
  certificates,
  courses,
  groups,
  locations,
  trainers,
}: {
  trainee: Trainee;
  enrollments: Enrollment[];
  payments: Payment[];
  attendance: Attendance[];
  certificates: Certificate[];
  courses: Course[];
  groups: Group[];
  locations: Location[];
  trainers: Trainer[];
}) {
  const traineeId = String(trainee.id);
  const score = scoreOf(trainee);
  const traineeEnrollments = enrollments.filter(
    (x) => String(x.trainee_id) === traineeId,
  );
  const traineePayments = payments.filter(
    (x) => String(x.trainee_id) === traineeId,
  );
  const traineeAttendance = attendance.filter(
    (x) => String(x.trainee_id) === traineeId,
  );
  const traineeCertificates = certificates.filter(
    (x) => String(x.trainee_id) === traineeId,
  );
  const latestEnrollment = traineeEnrollments[0];
  const latestPayment = traineePayments[0];
  const paidTotal = traineePayments
    .filter((p: any) =>
      ["paid", "validated", "completed", "success"].includes(
        String(p.status || "").toLowerCase(),
      ),
    )
    .reduce((sum: any, p: any) => sum + paymentAmount(p), 0);
  const currentCourseId = String(
    latestEnrollment?.course_id || traineeMeta(trainee, "course_id") || "",
  );
  const currentGroupId = String(
    latestEnrollment?.group_id || traineeMeta(trainee, "group_id") || "",
  );
  const currentTrainerId = String(traineeMeta(trainee, "trainer_id") || "");
  const currentLocationId = String(traineeMeta(trainee, "location_id") || "");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(15,23,42,.42)",
        backdropFilter: "blur(12px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        action={updateTraineeDossierAction}
        style={{
          width: "min(1280px,96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 32,
          border: "1px solid #e2e8f0",
          boxShadow: "0 35px 110px rgba(15,23,42,.28)",
        }}
      >
        <input type="hidden" name="trainee_id" value={traineeId} />
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            background: "linear-gradient(180deg,#fff,#f8fafc)",
            borderBottom: "1px solid #e7ecf4",
            padding: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
            <MiniIcon color={score < 55 && score > 0 ? "#e11d48" : "#355df6"}>
              {labelOf(trainee).slice(0, 1).toUpperCase()}
            </MiniIcon>
            <div>
              <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-.06em" }}>
                Edit Live Trainee Dossier
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 850,
                }}
              >
                {labelOf(trainee)} • ID {traineeId.slice(0, 8)} • same field map
                as New Trainee modal
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              form="delete-trainee-dossier-form"
              type="submit"
              style={{
                border: 0,
                borderRadius: 14,
                padding: "13px 18px",
                background: "#fee2e2",
                color: "#b91c1c",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <Link
              href="/academy/trainees"
              scroll={false}
              style={{
                textDecoration: "none",
                borderRadius: 14,
                padding: "13px 18px",
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #dbe3ef",
                fontWeight: 950,
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              style={{
                border: 0,
                borderRadius: 14,
                padding: "13px 22px",
                background: "#355df6",
                color: "#fff",
                fontWeight: 950,
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(53,93,246,.25)",
              }}
            >
              Save
            </button>
          </div>
        </div>

        <div style={{ padding: 22, display: "grid", gap: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,minmax(0,1fr))",
              gap: 14,
            }}
          >
            <Kpi
              icon="🎓"
              label="Enrollments"
              value={String(traineeEnrollments.length)}
              sub="academy_enrollments"
              color="#7c3aed"
            />
            <Kpi
              icon="💳"
              label="Paid"
              value={`${money(paidTotal)} MAD`}
              sub={`${traineePayments.length} payment records`}
              color="#16a34a"
            />
            <Kpi
              icon="☑"
              label="Attendance"
              value={String(traineeAttendance.length)}
              sub="presence records"
              color="#0891b2"
            />
            <Kpi
              icon="🏅"
              label="Certificates"
              value={String(traineeCertificates.length)}
              sub="issued/pending"
              color="#f59e0b"
            />
            <Kpi
              icon="📡"
              label="Live Sources"
              value="4"
              sub="courses, groups, locations, trainers"
              color="#355df6"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: 18,
            }}
          >
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Personal Information</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Identity, contact and source of the trainee file.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label style={labelStyle()}>
                  Full name
                  <input
                    name="full_name"
                    required
                    defaultValue={labelOf(trainee)}
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Phone
                  <input
                    name="phone"
                    defaultValue={trainee.phone || ""}
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Email
                  <input
                    name="email"
                    type="email"
                    defaultValue={trainee.email || ""}
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  City
                  <input
                    name="city"
                    defaultValue={trainee.city || ""}
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Source
                  <select
                    name="source"
                    defaultValue={trainee.source || "whatsapp"}
                    style={inputStyle()}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="academy_campaign">Academy campaign</option>
                    <option value="partner_referral">Partner referral</option>
                    <option value="ambassador_referral">
                      Ambassador referral
                    </option>
                    <option value="website">Website</option>
                    <option value="academy_frontdesk">Academy frontdesk</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Emergency contact
                  <input
                    name="emergency_contact"
                    defaultValue={
                      traineeMeta(trainee, "emergency_contact") || ""
                    }
                    placeholder="Name + phone"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  National ID
                  <input
                    name="national_id"
                    defaultValue={traineeMeta(trainee, "national_id") || ""}
                    placeholder="CIN / ID reference"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Status
                  <select
                    name="status"
                    defaultValue={statusOf(trainee)}
                    style={inputStyle()}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active file</option>
                    <option value="approved">Approved</option>
                    <option value="in_training">In training</option>
                    <option value="graduated">Graduated</option>
                    <option value="placed">Placed</option>
                    <option value="paused">Paused</option>
                  </select>
                </label>
              </div>
            </Card>

            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>
                Background & Eligibility
              </h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Professional, education and compliance readiness.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label style={labelStyle()}>
                  Education level
                  <select
                    name="education_level"
                    defaultValue={traineeMeta(trainee, "education_level") || ""}
                    style={inputStyle()}
                  >
                    <option value="">Select</option>
                    <option>Bac</option>
                    <option>Bac+2</option>
                    <option>Bac+3</option>
                    <option>Professional certificate</option>
                    <option>Experience based</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Experience level
                  <select
                    name="experience_level"
                    defaultValue={
                      traineeMeta(trainee, "experience_level") || "starter"
                    }
                    style={inputStyle()}
                  >
                    <option value="starter">Starter</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Eligibility
                  <select
                    name="eligibility_status"
                    defaultValue={eligibilityOf(trainee)}
                    style={inputStyle()}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="missing_info">Missing information</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Eligibility score
                  <input
                    name="eligibility_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={String(
                      traineeMeta(trainee, "eligibility_score") || score || 0,
                    )}
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Readiness score
                  <input
                    name="readiness_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={String(
                      trainee.readiness_score ||
                        traineeMeta(trainee, "readiness_score") ||
                        0,
                    )}
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Compliance score
                  <input
                    name="compliance_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={String(
                      trainee.compliance_score ||
                        traineeMeta(trainee, "compliance_score") ||
                        0,
                    )}
                    style={inputStyle()}
                  />
                </label>
                <label style={{ ...labelStyle(), gridColumn: "1 / -1" }}>
                  Professional background
                  <textarea
                    name="professional_background"
                    rows={4}
                    defaultValue={
                      traineeMeta(trainee, "professional_background") || ""
                    }
                    placeholder="Previous childcare, nursery, preschool, event, nanny or education experience..."
                    style={{ ...inputStyle(), resize: "vertical" }}
                  />
                </label>
                <label style={{ ...labelStyle(), gridColumn: "1 / -1" }}>
                  Compliance note
                  <textarea
                    name="compliance_note"
                    rows={3}
                    defaultValue={traineeMeta(trainee, "compliance_note") || ""}
                    placeholder="Missing documents, interview notes, behavior, verification status..."
                    style={{ ...inputStyle(), resize: "vertical" }}
                  />
                </label>
              </div>
            </Card>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 18,
            }}
          >
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Course & Group Sync</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Live connected to Academy course and group tables.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle()}>
                  Course
                  <select
                    name="course_id"
                    defaultValue={currentCourseId}
                    style={inputStyle()}
                  >
                    <option value="">No course yet</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.id} {c.level ? `• ${c.level}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Group
                  <select
                    name="group_id"
                    defaultValue={currentGroupId}
                    style={inputStyle()}
                  >
                    <option value="">No group yet</option>
                    {groups.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name || g.id} {g.status ? `• ${g.status}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Enrollment status
                  <select
                    name="enrollment_status"
                    defaultValue={latestEnrollment?.status || "pending"}
                    style={inputStyle()}
                  >
                    <option value="pending">Pending</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="waiting_list">Waiting list</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Schedule preference
                  <input
                    name="schedule_preference"
                    defaultValue={
                      traineeMeta(trainee, "schedule_preference") || ""
                    }
                    placeholder="Morning / evening / weekend"
                    style={inputStyle()}
                  />
                </label>
              </div>
            </Card>

            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Location & Trainer</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Operational assignment and placement goal.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle()}>
                  Training location
                  <select
                    name="location_id"
                    defaultValue={currentLocationId}
                    style={inputStyle()}
                  >
                    <option value="">No location yet</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.name || l.id} {l.city ? `• ${l.city}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Trainer
                  <select
                    name="trainer_id"
                    defaultValue={currentTrainerId}
                    style={inputStyle()}
                  >
                    <option value="">No trainer yet</option>
                    {trainers.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.id}{" "}
                        {t.specialty ? `• ${t.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle()}>
                  Placement goal
                  <select
                    name="placement_goal"
                    defaultValue={
                      traineeMeta(trainee, "placement_goal") || "home_nanny"
                    }
                    style={inputStyle()}
                  >
                    <option value="home_nanny">Home nanny</option>
                    <option value="preschool_assistant">
                      Preschool assistant
                    </option>
                    <option value="event_kids_leader">Event kids leader</option>
                    <option value="nursery_support">Nursery support</option>
                    <option value="partner_staffing">Partner staffing</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Enrollment note
                  <input
                    name="enrollment_note"
                    defaultValue={
                      latestEnrollment?.metadata?.enrollment_note || ""
                    }
                    placeholder="Manager instruction for group/course assignment"
                    style={inputStyle()}
                  />
                </label>
              </div>
            </Card>

            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Payment & Notes</h3>
              <p
                style={{
                  margin: "5px 0 16px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Add a new ledger entry and update manager notes.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle()}>
                  New payment MAD
                  <input
                    name="initial_payment"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    style={inputStyle()}
                  />
                </label>
                <label style={labelStyle()}>
                  Payment status
                  <select
                    name="payment_status"
                    defaultValue={latestPayment?.status || "pending"}
                    style={inputStyle()}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="validated">Validated</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Payment method
                  <select
                    name="payment_method"
                    defaultValue={
                      traineeMeta(trainee, "payment_method") || "cash"
                    }
                    style={inputStyle()}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile money</option>
                  </select>
                </label>
                <label style={labelStyle()}>
                  Payment reference
                  <input
                    name="payment_reference"
                    defaultValue={
                      traineeMeta(trainee, "payment_reference") || ""
                    }
                    placeholder="Receipt / transaction reference"
                    style={inputStyle()}
                  />
                </label>
                <label style={{ ...labelStyle(), gridColumn: "1 / -1" }}>
                  Manager notes
                  <textarea
                    name="notes"
                    rows={5}
                    defaultValue={
                      trainee.notes || traineeMeta(trainee, "notes") || ""
                    }
                    placeholder="Operational notes, follow-up, risk, promise, missing document, partner placement comments..."
                    style={{ ...inputStyle(), resize: "vertical" }}
                  />
                </label>
              </div>
            </Card>
          </div>

          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 20 }}>Live Sync Summary</h3>
            <p
              style={{
                margin: "6px 0 16px",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              This modal is intentionally aligned with New Trainee dossier
              fields, while preserving existing Academy live records.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                gap: 12,
              }}
            >
              <Field
                label="Last enrollment"
                value={
                  latestEnrollment
                    ? `${latestEnrollment.status || "record"} • ${date(latestEnrollment.created_at)}`
                    : "No enrollment yet"
                }
              />
              <Field
                label="Last payment"
                value={
                  latestPayment
                    ? `${latestPayment.status || "record"} • ${money(paymentAmount(latestPayment))} MAD`
                    : "No payment yet"
                }
              />
              <Field
                label="Attendance records"
                value={String(traineeAttendance.length)}
              />
              <Field
                label="Certificates"
                value={String(traineeCertificates.length)}
              />
            </div>
          </Card>
        </div>
      </form>
      <form
        id="delete-trainee-dossier-form"
        action={deleteTraineeDossierAction}
        style={{ display: "none" }}
      >
        <input type="hidden" name="trainee_id" value={traineeId} />
        <input type="hidden" name="trainee_label" value={labelOf(trainee)} />
      </form>
    </div>
  );
}

export default async function AcademyTraineesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  await requireAccess("academy.view");
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const openId = Array.isArray(resolvedSearchParams.open)
    ? resolvedSearchParams.open[0]
    : resolvedSearchParams.open;
  const createMode = Array.isArray(resolvedSearchParams.create)
    ? resolvedSearchParams.create[0]
    : resolvedSearchParams.create;
  const supabase = await createClient();

  const [
    trainees,
    enrollments,
    payments,
    attendance,
    certificates,
    courses,
    groups,
    locations,
    trainers,
  ] = await Promise.all([
    safeTable<Trainee>(supabase, "academy_trainees", "*"),
    safeTable<Enrollment>(supabase, "academy_enrollments", "*"),
    safeTable<Payment>(supabase, "academy_payments", "*"),
    safeTable<Attendance>(supabase, "academy_attendance", "*"),
    safeTable<Certificate>(supabase, "academy_certificates", "*"),
    safeTable<Course>(supabase, "academy_courses", "*"),
    safeTable<Group>(supabase, "academy_groups", "*"),
    safeTable<Location>(supabase, "academy_locations", "*"),
    safeTable<Trainer>(supabase, "academy_trainers", "*"),
  ]);

  const traineeIdsWithEnrollment = new Set(
    enrollments
      .map((e: any) => e.trainee_id)
      .filter(Boolean)
      .map(String),
  );
  const traineeIdsWithPayment = new Set(
    payments
      .filter((p: any) =>
        ["paid", "validated", "completed", "success"].includes(
          String(p.status || "").toLowerCase(),
        ),
      )
      .map((p: any) => p.trainee_id)
      .filter(Boolean)
      .map(String),
  );
  const traineeIdsWithCertificate = new Set(
    certificates
      .map((c: any) => c.trainee_id)
      .filter(Boolean)
      .map(String),
  );
  const active = trainees.filter(
    (t) =>
      ["active", "enrolled", "in_training", "approved"].includes(statusOf(t)) ||
      traineeIdsWithEnrollment.has(String(t.id)),
  ).length;
  const pendingEligibility = trainees.filter(
    (t) =>
      eligibilityOf(t).includes("pending") ||
      eligibilityOf(t).includes("missing"),
  ).length;
  const approvedEligibility = trainees.filter(
    (t) =>
      eligibilityOf(t).includes("approved") ||
      eligibilityOf(t).includes("eligible"),
  ).length;
  const highRisk = trainees.filter(
    (t) => scoreOf(t) > 0 && scoreOf(t) < 55,
  ).length;
  const paidRevenue = payments
    .filter((p: any) => traineeIdsWithPayment.has(String(p.trainee_id)))
    .reduce((s: any, p: any) => s + paymentAmount(p), 0);
  const averageReadiness = trainees.length
    ? Math.round(trainees.reduce((s: any, t: any) => s + scoreOf(t), 0) / trainees.length)
    : 0;
  const recentTrainees = trainees.slice(0, 12);
  const selectedTrainee = openId
    ? trainees.find((t: any) => String(t.id) === String(openId))
    : null;

  const lifecycle: [string, number, string, string][] = [
    [
      "Prospects",
      trainees.filter(
        (t) => statusOf(t).includes("prospect") || statusOf(t) === "new",
      ).length,
      "#355df6",
      "👤",
    ],
    ["Eligible", approvedEligibility, "#16a34a", "🛡️"],
    ["Enrolled", traineeIdsWithEnrollment.size, "#7c3aed", "🎓"],
    ["Paid", traineeIdsWithPayment.size, "#0891b2", "💳"],
    ["Certified", traineeIdsWithCertificate.size, "#f59e0b", "🏅"],
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ display: "flex" }}>
        <Sidebar />
        <section style={{ flex: 1, padding: 24, overflow: "hidden" }}>
          <header
            style={{
              height: 74,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>☰</span>
                <h1
                  style={{ margin: 0, fontSize: 30, letterSpacing: "-.06em" }}
                >
                  Trainees Operations Center
                </h1>
                <Pill tone="purple">v10.0 live</Pill>
              </div>
              <p
                style={{
                  margin: "6px 0 0 38px",
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                Multilayer trainee management synced with eligibility,
                enrollments, payments, attendance, certificates and placement.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Link
                href="/academy"
                style={{
                  textDecoration: "none",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#0f172a",
                  borderRadius: 13,
                  padding: "12px 18px",
                  fontWeight: 950,
                }}
              >
                Academy Home
              </Link>
              <div
                style={{
                  width: 290,
                  height: 45,
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 14px",
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                ⌕ Search trainees...
              </div>
              <span
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 15,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                🔔
              </span>
            </div>
          </header>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "170px repeat(5,1fr)",
                gap: 10,
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>Quick Actions ›</h3>
              {quickActions.map((action: any) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    minHeight: 43,
                    borderRadius: 13,
                    background: action.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 950,
                    boxShadow: `0 12px 25px ${action.color}2d`,
                  }}
                >
                  <span>{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,minmax(0,1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Kpi
              icon="👥"
              label="Total Trainees"
              value={String(trainees.length)}
              sub="live academy_trainees"
              color="#355df6"
            />
            <Kpi
              icon="🟢"
              label="Active Files"
              value={String(active)}
              sub="approved or in training"
              color="#16a34a"
            />
            <Kpi
              icon="🛡️"
              label="Eligibility Queue"
              value={String(pendingEligibility)}
              sub="needs validation"
              color="#f97316"
            />
            <Kpi
              icon="🎓"
              label="Enrolled"
              value={String(traineeIdsWithEnrollment.size)}
              sub="linked records"
              color="#7c3aed"
            />
            <Kpi
              icon="💳"
              label="Paid Revenue"
              value={`${money(paidRevenue)} MAD`}
              sub="validated payments"
              color="#0891b2"
            />
            <Kpi
              icon="⚠️"
              label="Risk Files"
              value={String(highRisk)}
              sub="low readiness"
              color="#e11d48"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr .9fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Card style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 19 }}>
                    Trainee Lifecycle Pipeline
                  </h3>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    From candidate file to certificate and job placement.
                  </p>
                </div>
                <Pill tone="blue">live</Pill>
              </div>
              <div style={{ marginTop: 22, display: "grid", gap: 15 }}>
                {lifecycle.map((row: any) => (
                  <div
                    key={row[0]}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px 1fr 60px",
                      gap: 13,
                      alignItems: "center",
                    }}
                  >
                    <MiniIcon color={row[2]}>{row[3]}</MiniIcon>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 7,
                        }}
                      >
                        <strong style={{ fontSize: 13 }}>{row[0]}</strong>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {pct(row[1], Math.max(trainees.length, 1))}%
                        </span>
                      </div>
                      <Meter
                        value={pct(row[1], Math.max(trainees.length, 1))}
                        color={row[2]}
                      />
                    </div>
                    <strong style={{ fontSize: 22, textAlign: "right" }}>
                      {row[1]}
                    </strong>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: 0, fontSize: 19 }}>Readiness Engine</h3>
              <p
                style={{
                  margin: "5px 0 20px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Identity, compliance, eligibility and operational readiness.
              </p>
              <div style={{ display: "grid", placeItems: "center" }}>
                <Ring
                  value={averageReadiness}
                  color={
                    averageReadiness >= 75
                      ? "#16a34a"
                      : averageReadiness >= 55
                        ? "#f97316"
                        : "#e11d48"
                  }
                />
              </div>
              <div style={{ display: "grid", gap: 11, marginTop: 20 }}>
                {[
                  ["Ready for enrollment", approvedEligibility],
                  ["Missing info", pendingEligibility],
                  ["High risk dossier", highRisk],
                ].map((r, i) => (
                  <div
                    key={r[0]}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      border: "1px solid #eef2f7",
                      borderRadius: 13,
                      padding: 12,
                      fontWeight: 900,
                    }}
                  >
                    <span style={{ color: "#475569" }}>{r[0]}</span>
                    <strong
                      style={{ color: ["#16a34a", "#f97316", "#e11d48"][i] }}
                    >
                      {r[1]}
                    </strong>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: 0, fontSize: 19 }}>Sync Intelligence</h3>
              <p
                style={{
                  margin: "5px 0 18px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Cross-module connections for each trainee file.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  [
                    "Enrollment Sync",
                    traineeIdsWithEnrollment.size,
                    "#7c3aed",
                    "academy_enrollments",
                  ],
                  [
                    "Payment Sync",
                    traineeIdsWithPayment.size,
                    "#16a34a",
                    "academy_payments",
                  ],
                  [
                    "Attendance Sync",
                    new Set(attendance.map((a: any) => a.trainee_id).filter(Boolean))
                      .size,
                    "#355df6",
                    "academy_attendance",
                  ],
                  [
                    "Certificate Sync",
                    traineeIdsWithCertificate.size,
                    "#f59e0b",
                    "academy_certificates",
                  ],
                ].map((row: any) => (
                  <div
                    key={row[0]}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      border: "1px solid #eef2f7",
                      borderRadius: 16,
                      padding: 13,
                    }}
                  >
                    <MiniIcon color={String(row[2])}>●</MiniIcon>
                    <div>
                      <strong style={{ fontSize: 13 }}>{row[0]}</strong>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {row[3]}
                      </p>
                    </div>
                    <strong style={{ fontSize: 22 }}>{row[1]}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.45fr .9fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Card style={{ padding: 22 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{ margin: 0, fontSize: 22, letterSpacing: "-.04em" }}
                  >
                    Live Trainee Registry
                  </h2>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Click Open to display a live in-page dossier modal.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["All", "Risk", "Eligible", "Enrolled", "Paid"].map(
                    (x, i) => (
                      <span
                        key={x}
                        style={{
                          border: "1px solid #e2e8f0",
                          background: i === 0 ? "#355df6" : "#fff",
                          color: i === 0 ? "#fff" : "#64748b",
                          padding: "9px 16px",
                          borderRadius: 12,
                          fontWeight: 950,
                          fontSize: 12,
                        }}
                      >
                        {x}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <div
                style={{
                  overflow: "hidden",
                  border: "1px solid #eef2f7",
                  borderRadius: 18,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr .75fr .7fr .65fr .65fr .8fr",
                    gap: 0,
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 950,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  <span style={{ padding: 14 }}>Trainee</span>
                  <span style={{ padding: 14 }}>Status</span>
                  <span style={{ padding: 14 }}>Eligibility</span>
                  <span style={{ padding: 14 }}>Payment</span>
                  <span style={{ padding: 14 }}>Score</span>
                  <span style={{ padding: 14 }}>Action</span>
                </div>
                {recentTrainees.length ? (
                  recentTrainees.map((t: any) => {
                    const id = String(t.id);
                    const score = scoreOf(t);
                    const enrolled = traineeIdsWithEnrollment.has(id);
                    const paid = traineeIdsWithPayment.has(id);
                    const certified = traineeIdsWithCertificate.has(id);
                    const eligibility = eligibilityOf(t);
                    return (
                      <div
                        key={id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1.2fr .75fr .7fr .65fr .65fr .8fr",
                          alignItems: "center",
                          borderTop: "1px solid #eef2f7",
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            padding: 14,
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <MiniIcon
                            color={
                              score < 55 && score > 0 ? "#e11d48" : "#355df6"
                            }
                          >
                            {labelOf(t).slice(0, 1).toUpperCase()}
                          </MiniIcon>
                          <div>
                            <strong style={{ display: "block" }}>
                              {labelOf(t)}
                            </strong>
                            <span
                              style={{
                                color: "#64748b",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {t.city || "City not set"} •{" "}
                              {t.phone || t.email || "No contact"}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: 14 }}>
                          <Pill
                            tone={
                              enrolled
                                ? "purple"
                                : statusOf(t).includes("active")
                                  ? "green"
                                  : "slate"
                            }
                          >
                            {statusOf(t)}
                          </Pill>
                        </div>
                        <div style={{ padding: 14 }}>
                          <Pill
                            tone={
                              eligibility.includes("approved") ||
                              eligibility.includes("eligible")
                                ? "green"
                                : eligibility.includes("reject")
                                  ? "rose"
                                  : "orange"
                            }
                          >
                            {eligibility}
                          </Pill>
                        </div>
                        <div style={{ padding: 14 }}>
                          <Pill tone={paid ? "green" : "orange"}>
                            {paid ? "paid" : "pending"}
                          </Pill>
                        </div>
                        <div style={{ padding: 14 }}>
                          <strong>{score || "—"}</strong>
                          <div style={{ marginTop: 6 }}>
                            <Meter
                              value={score}
                              color={
                                score >= 75
                                  ? "#16a34a"
                                  : score >= 55
                                    ? "#f97316"
                                    : "#e11d48"
                              }
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            padding: 14,
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={`/academy/trainees?open=${id}`}
                            scroll={false}
                            style={{
                              textDecoration: "none",
                              color: "#1d4ed8",
                              fontWeight: 950,
                            }}
                          >
                            Open
                          </Link>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <Link
                            href={
                              certified
                                ? "/academy/job-placement"
                                : enrolled
                                  ? "/academy/attendance"
                                  : "/academy/eligibility"
                            }
                            style={{
                              textDecoration: "none",
                              color: "#0f172a",
                              fontWeight: 900,
                            }}
                          >
                            {certified
                              ? "Place"
                              : enrolled
                                ? "Track"
                                : "Validate"}
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "#64748b",
                      fontWeight: 850,
                    }}
                  >
                    No live trainees found yet. Create trainee records in
                    academy_trainees to activate this page.
                  </div>
                )}
              </div>
            </Card>

            <Card style={{ padding: 22 }}>
              <h2 style={{ margin: 0, fontSize: 22, letterSpacing: "-.04em" }}>
                Manager Control Panel
              </h2>
              <p
                style={{
                  margin: "5px 0 18px",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Direct execution shortcuts for trainee operations.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  [
                    "Create dossier",
                    "/academy/trainees?create=1",
                    "👥",
                    "#355df6",
                    "Open a complete trainee file with identity, compliance, course and group data.",
                  ],
                  [
                    "Validate eligibility",
                    "/academy/eligibility",
                    "🛡️",
                    "#f97316",
                    "Approve, reject or request missing information.",
                  ],
                  [
                    "Enroll into program",
                    "/academy/enrollments",
                    "🎓",
                    "#7c3aed",
                    "Assign course, group, trainer and training timeline.",
                  ],
                  [
                    "Record payment",
                    "/academy/payments",
                    "💳",
                    "#16a34a",
                    "Update ledger, unpaid balance and revenue bridge.",
                  ],
                  [
                    "Track attendance",
                    "/academy/attendance",
                    "☑",
                    "#0891b2",
                    "Control presence, discipline and dropout risk.",
                  ],
                  [
                    "Issue certificate",
                    "/academy/certificates",
                    "🏅",
                    "#f59e0b",
                    "Validate completion evidence and certificate registry.",
                  ],
                ].map((action: any) => (
                  <Link
                    key={action[0]}
                    href={String(action[1])}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: 13,
                      border: "1px solid #eef2f7",
                      borderRadius: 16,
                      textDecoration: "none",
                      color: "#0f172a",
                    }}
                  >
                    <MiniIcon color={String(action[3])}>{action[2]}</MiniIcon>
                    <div>
                      <strong style={{ fontSize: 13 }}>{action[0]}</strong>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#64748b",
                          fontSize: 11,
                          fontWeight: 750,
                        }}
                      >
                        {action[4]}
                      </p>
                    </div>
                    <strong style={{ color: "#94a3b8" }}>›</strong>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <Card style={{ padding: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <div>
                <h2
                  style={{ margin: 0, fontSize: 22, letterSpacing: "-.04em" }}
                >
                  Trainee Command Layers
                </h2>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  Every card is linked to an Academy production route and keeps
                  the same Academy visual system.
                </p>
              </div>
              <Pill tone="blue">uniform sidebar</Pill>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,minmax(0,1fr))",
                gap: 12,
              }}
            >
              {[
                [
                  "Identity Files",
                  "Permanent folders, contact, city, source and compliance.",
                  "/academy/trainees?create=1",
                  "👤",
                  "#355df6",
                ],
                [
                  "Eligibility Gate",
                  "Scoring, approval, rejection and missing information.",
                  "/academy/eligibility",
                  "🛡️",
                  "#f97316",
                ],
                [
                  "Enrollment Bridge",
                  "Convert approved candidates into program records.",
                  "/academy/enrollments",
                  "🎓",
                  "#7c3aed",
                ],
                [
                  "Finance Layer",
                  "Payments, debt, aging and revenue sync.",
                  "/academy/payments",
                  "💳",
                  "#16a34a",
                ],
                [
                  "Attendance Layer",
                  "Presence, lateness, absence and dropout signals.",
                  "/academy/attendance",
                  "☑",
                  "#0891b2",
                ],
                [
                  "Training Progress",
                  "Course, group, trainer and completion progress.",
                  "/academy/courses",
                  "📚",
                  "#2563eb",
                ],
                [
                  "Certificates",
                  "Issue, registry, verification and export.",
                  "/academy/certificates",
                  "🏅",
                  "#f59e0b",
                ],
                [
                  "Placement",
                  "Match graduates with partners and employers.",
                  "/academy/job-placement",
                  "🎯",
                  "#0d9488",
                ],
                [
                  "Communications",
                  "Alerts, follow-ups and announcements.",
                  "/academy/alerts-sales",
                  "📣",
                  "#e11d48",
                ],
                [
                  "Reports",
                  "Board-ready analytics and audit evidence.",
                  "/academy/reports",
                  "📈",
                  "#64748b",
                ],
              ].map((layer: any) => (
                <Link
                  key={String(layer[0])}
                  href={String(layer[2])}
                  style={{
                    minHeight: 124,
                    padding: 16,
                    border: "1px solid #e7ecf4",
                    borderRadius: 18,
                    background: "#fff",
                    textDecoration: "none",
                    color: "#0f172a",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <MiniIcon color={String(layer[4])}>{layer[3]}</MiniIcon>
                  <div>
                    <strong style={{ display: "block", fontSize: 14 }}>
                      {layer[0]}
                    </strong>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: 11,
                        fontWeight: 750,
                        lineHeight: 1.45,
                      }}
                    >
                      {layer[1]}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>
      </div>
      {createMode ? (
        <NewTraineeDossierModal
          courses={courses}
          groups={groups}
          locations={locations}
          trainers={trainers}
        />
      ) : null}
      {selectedTrainee ? (
        <EditableTraineeDossierModal
          trainee={selectedTrainee}
          enrollments={enrollments}
          payments={payments}
          attendance={attendance}
          certificates={certificates}
          courses={courses}
          groups={groups}
          locations={locations}
          trainers={trainers}
        />
      ) : null}
    </main>
  );
}
