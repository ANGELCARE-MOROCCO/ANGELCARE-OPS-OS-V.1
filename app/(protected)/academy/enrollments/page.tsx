import Link from "next/link";
import type React from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/auth/requireAccess";
import { createEnrollment } from "../_actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;
type Tone =
  | "blue"
  | "violet"
  | "green"
  | "orange"
  | "red"
  | "cyan"
  | "slate"
  | "pink";

type SidebarItem = {
  label: string;
  href: string;
  icon: string;
  group: "academy" | "system";
};

const sidebarItems: SidebarItem[] = [
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

const enrollmentStatuses = [
  "pending",
  "enrolled",
  "active",
  "completed",
  "cancelled",
  "dropped",
  "on_hold",
];
const tones: Record<
  Tone,
  { bg: string; ink: string; ring: string; shadow: string }
> = {
  blue: {
    bg: "#eef4ff",
    ink: "#355df6",
    ring: "#dbe6ff",
    shadow: "rgba(53,93,246,.18)",
  },
  violet: {
    bg: "#f3eefe",
    ink: "#7c3aed",
    ring: "#e9ddff",
    shadow: "rgba(124,58,237,.18)",
  },
  green: {
    bg: "#ecfdf3",
    ink: "#16a34a",
    ring: "#bbf7d0",
    shadow: "rgba(22,163,74,.16)",
  },
  orange: {
    bg: "#fff7ed",
    ink: "#f97316",
    ring: "#fed7aa",
    shadow: "rgba(249,115,22,.18)",
  },
  red: {
    bg: "#fff1f2",
    ink: "#e11d48",
    ring: "#fecdd3",
    shadow: "rgba(225,29,72,.16)",
  },
  cyan: {
    bg: "#ecfeff",
    ink: "#0891b2",
    ring: "#cffafe",
    shadow: "rgba(8,145,178,.16)",
  },
  slate: {
    bg: "#f8fafc",
    ink: "#475569",
    ring: "#e2e8f0",
    shadow: "rgba(71,85,105,.12)",
  },
  pink: {
    bg: "#fdf2f8",
    ink: "#db2777",
    ring: "#fbcfe8",
    shadow: "rgba(219,39,119,.16)",
  },
};

async function safeTable(
  supabase: any,
  table: string,
  select = "*",
  limit = 300,
): Promise<AnyRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as AnyRow[];
}

function s(value: unknown, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function n(value: unknown) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function date(value: unknown) {
  if (!value) return "—";
  try {
    return new Date(String(value)).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function money(value: unknown) {
  const amount = n(value);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M MAD`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K MAD`;
  return `${Math.round(amount)} MAD`;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function nameOf(list: AnyRow[], id: unknown, fallback = "—") {
  const row = list.find((item: AnyRow) => String(item.id) === String(id));
  return s(row?.full_name || row?.title || row?.name || row?.label, fallback);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x: string) => x[0])
      .join("")
      .toUpperCase() || "AC"
  );
}

function statusTone(status: unknown): Tone {
  const value = String(status || "").toLowerCase();
  if (
    ["enrolled", "active", "completed", "approved", "paid"].some((x: any) =>
      value.includes(x),
    )
  )
    return "green";
  if (["pending", "draft", "waiting", "review"].some((x: any) => value.includes(x)))
    return "orange";
  if (
    ["cancel", "drop", "risk", "blocked", "rejected", "late", "unpaid"].some(
      (x) => value.includes(x),
    )
  )
    return "red";
  if (["hold", "pause"].some((x: any) => value.includes(x))) return "violet";
  return "blue";
}

function Card({
  children,
  style,
  ...props
}: React.ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      style={{
        background: "#fff",
        border: "1px solid #e7ecf4",
        borderRadius: 26,
        boxShadow: "0 20px 55px rgba(15,23,42,.055)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Icon({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = tones[tone];
  return (
    <span
      style={{
        width: 44,
        height: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        background: t.bg,
        color: t.ink,
        border: `1px solid ${t.ring}`,
        boxShadow: `0 10px 22px ${t.shadow}`,
        fontSize: 19,
      }}
    >
      {children}
    </span>
  );
}

function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${t.ring}`,
        background: t.bg,
        color: t.ink,
        borderRadius: 999,
        padding: "7px 11px",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
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
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Icon tone={tone}>{icon}</Icon>
        <div>
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {label}
          </p>
          <strong
            style={{
              display: "block",
              color: "#0f172a",
              fontSize: 28,
              letterSpacing: "-.05em",
              lineHeight: 1.1,
            }}
          >
            {value}
          </strong>
          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 850,
            }}
          >
            {sub}
          </p>
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 18,
        alignItems: "start",
        marginBottom: 17,
      }}
    >
      <div>
        {eyebrow ? (
          <p
            style={{
              margin: "0 0 5px",
              color: "#355df6",
              fontSize: 11,
              fontWeight: 1000,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 22,
            letterSpacing: "-.045em",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "7px 0 0",
            color: "#64748b",
            fontSize: 13,
            lineHeight: 1.5,
            fontWeight: 760,
          }}
        >
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

function InputShell({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "grid",
        gap: 8,
        color: "#64748b",
        fontSize: 11,
        fontWeight: 1000,
        letterSpacing: ".1em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

function TrendBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "end",
        height: 115,
        padding: "14px 4px 0",
      }}
    >
      {values.map((value, index) => (
        <span
          key={index}
          title={String(value)}
          style={{
            flex: 1,
            minWidth: 12,
            height: `${Math.max(12, (value / max) * 100)}%`,
            borderRadius: "10px 10px 4px 4px",
            background: `linear-gradient(180deg, ${index % 3 === 0 ? "#355df6" : index % 3 === 1 ? "#7c3aed" : "#0891b2"}, #dbeafe)`,
            boxShadow: "0 12px 24px rgba(53,93,246,.13)",
          }}
        />
      ))}
    </div>
  );
}

function Progress({ value, tone = "blue" }: { value: number; tone?: Tone }) {
  const t = tones[tone];
  return (
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: "#edf2f7",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: "100%",
          borderRadius: 999,
          background: t.ink,
        }}
      />
    </div>
  );
}

type AcademyEnrollmentsPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

async function resolveSearchParams(
  searchParams: AcademyEnrollmentsPageProps["searchParams"],
) {
  const resolved =
    searchParams && typeof (searchParams as any).then === "function"
      ? await searchParams
      : searchParams;
  return resolved || {};
}

async function updateEnrollmentDossierAction(fd: FormData) {
  "use server";
  const supabase = await createClient();
  const enrollmentId = String(fd.get("enrollment_id") || "").trim();
  const traineeId = String(fd.get("trainee_id") || "").trim();
  const status = String(fd.get("status") || "enrolled").trim();
  const courseId = String(fd.get("course_id") || "").trim() || null;
  const groupId = String(fd.get("group_id") || "").trim() || null;
  const note = String(fd.get("note") || "").trim() || null;
  if (!enrollmentId) throw new Error("Missing enrollment id");

  const payload = {
    course_id: courseId,
    group_id: groupId,
    status,
    note,
    updated_at: new Date().toISOString(),
  };
  const update = await supabase
    .from("academy_enrollments")
    .update(payload)
    .eq("id", enrollmentId);
  if (update.error) throw new Error(update.error.message);

  if (traineeId) {
    const traineeUpdate = await supabase
      .from("academy_trainees")
      .update({
        status: status === "completed" ? "graduated" : "enrolled",
        assigned_group_id: groupId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", traineeId);
    if (traineeUpdate.error) throw new Error(traineeUpdate.error.message);
  }

  await supabase.from("academy_audit_logs").insert({
    action: "update_enrollment_from_live_modal",
    entity: "academy_enrollments",
    entity_id: enrollmentId,
    note: `Enrollment dossier updated to ${status}`,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/academy/enrollments");
  revalidatePath("/academy/trainees");
  revalidatePath("/academy");
  redirect("/academy/enrollments");
}

export default async function AcademyEnrollmentsPage({
  searchParams,
}: AcademyEnrollmentsPageProps) {
  await requireAccess("academy.view");
  const supabase = await createClient();
  const [
    trainees,
    courses,
    trainers,
    groups,
    locations,
    enrollments,
    payments,
    attendance,
    certificates,
    alerts,
    audit,
  ] = await Promise.all([
    safeTable(supabase, "academy_trainees"),
    safeTable(supabase, "academy_courses"),
    safeTable(supabase, "academy_trainers"),
    safeTable(supabase, "academy_groups"),
    safeTable(supabase, "academy_locations"),
    safeTable(supabase, "academy_enrollments"),
    safeTable(supabase, "academy_payments"),
    safeTable(supabase, "academy_attendance"),
    safeTable(supabase, "academy_certificates"),
    safeTable(supabase, "academy_alerts"),
    safeTable(supabase, "academy_audit_logs", "*", 80),
  ]);

  const params = await resolveSearchParams(searchParams);
  const selectedEnrollmentId = Array.isArray(params.enrollment_id)
    ? params.enrollment_id[0]
    : params.enrollment_id;
  const selectedEnrollment = selectedEnrollmentId
    ? enrollments.find(
        (item) => String(item.id) === String(selectedEnrollmentId),
      )
    : null;

  const normalizeStatus = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const approvedEligibilityStatuses = new Set([
    "approved",
    "approuve",
    "eligible",
    "eligibile",
    "validated",
    "valide",
    "accepted",
    "accepte",
    "admis",
    "admissible",
    "ready",
    "ready_for_enrollment",
    "enrollment_ready",
    "enrolled",
    "active",
  ]);

  const blockedTraineeStatuses = new Set([
    "deleted",
    "archived",
    "rejected",
    "blocked",
    "cancelled",
    "canceled",
    "dropped",
    "inactive",
  ]);

  // Production rule: a trainee can still have status='prospect' while eligibility_status='approuvé'.
  // The enrollment selector must follow eligibility_status first, not lifecycle/status alone.
  const eligible = trainees.filter((t: AnyRow) => {
    const eligibility = normalizeStatus(
      t.eligibility_status ||
        t.eligibility ||
        t.approval_status ||
        t.validation_status,
    );
    const status = normalizeStatus(t.status || t.lifecycle_status);
    if (blockedTraineeStatuses.has(status)) return false;
    return (
      approvedEligibilityStatuses.has(eligibility) ||
      approvedEligibilityStatuses.has(status)
    );
  });
  const activeEnrollments = enrollments.filter((e: AnyRow) =>
    ["active", "enrolled", "in_progress", "confirmed"].includes(
      String(e.status || "").toLowerCase(),
    ),
  );
  const pendingEnrollments = enrollments.filter((e: AnyRow) =>
    ["pending", "draft", "review", "waiting"].includes(
      String(e.status || "").toLowerCase(),
    ),
  );
  const riskyEnrollments = enrollments.filter((e: AnyRow) =>
    ["blocked", "risk", "cancelled", "dropped", "on_hold"].some((x: any) =>
      String(e.status || "")
        .toLowerCase()
        .includes(x),
    ),
  );
  const completedEnrollments = enrollments.filter((e: AnyRow) =>
    ["completed", "graduated", "closed"].includes(
      String(e.status || "").toLowerCase(),
    ),
  );
  const paidTotal = payments.reduce(
    (sum, p) =>
      sum + n(p.amount || p.amount_mad || p.paid_amount || p.total_amount),
    0,
  );
  const attendanceCountByTrainee = new Map<string, number>();
  attendance.forEach((row: any) =>
    attendanceCountByTrainee.set(
      String(row.trainee_id),
      (attendanceCountByTrainee.get(String(row.trainee_id)) || 0) + 1,
    ),
  );
  const paymentByTrainee = new Map<string, number>();
  payments.forEach((row: any) =>
    paymentByTrainee.set(
      String(row.trainee_id),
      (paymentByTrainee.get(String(row.trainee_id)) || 0) +
        n(row.amount || row.amount_mad || row.paid_amount || row.total_amount),
    ),
  );
  const certByTrainee = new Set(certificates.map((c: AnyRow) => String(c.trainee_id)));

  const statusCounts = enrollmentStatuses.map((status: string) => ({
    status,
    count: enrollments.filter(
      (e: AnyRow) => String(e.status || "").toLowerCase() === status,
    ).length,
  }));
  const monthlyTrend = Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - index));
    const key = day.toISOString().slice(0, 10);
    return enrollments.filter(
      (e: AnyRow) => String(e.created_at || "").slice(0, 10) === key,
    ).length;
  });
  const groupLoad = groups.slice(0, 8).map((g: AnyRow) => {
    const count = enrollments.filter(
      (e: AnyRow) => String(e.group_id) === String(g.id),
    ).length;
    const capacity = n(g.capacity || g.max_capacity || 12) || 12;
    return { group: g, count, capacity, fill: pct(count, capacity) };
  });
  const courseLoad = courses.slice(0, 6).map((c: AnyRow) => {
    const count = enrollments.filter(
      (e: AnyRow) => String(e.course_id) === String(c.id),
    ).length;
    const revenue = payments
      .filter((p: AnyRow) => String(p.course_id) === String(c.id))
      .reduce(
        (sum: number, p: AnyRow) => sum + n(p.amount || p.amount_mad || p.total_amount),
        0,
      );
    return {
      course: c,
      count,
      revenue,
      completion: pct(
        completedEnrollments.filter((e: AnyRow) => String(e.course_id) === String(c.id))
          .length,
        Math.max(1, count),
      ),
    };
  });
  const recentEnrollments = enrollments.slice(0, 9);
  const latestSignals = [...audit.slice(0, 5), ...alerts.slice(0, 4)].slice(
    0,
    8,
  );
  const unassigned = enrollments.filter(
    (e: AnyRow) => !e.group_id || !e.course_id,
  ).length;
  const paymentCoverage = pct(
    enrollments.filter((e: AnyRow) => paymentByTrainee.get(String(e.trainee_id)))
      .length,
    enrollments.length,
  );
  const attendanceCoverage = pct(
    enrollments.filter((e: AnyRow) =>
      attendanceCountByTrainee.get(String(e.trainee_id)),
    ).length,
    enrollments.length,
  );
  const certificateReadiness = pct(
    enrollments.filter((e: AnyRow) => certByTrainee.has(String(e.trainee_id))).length,
    enrollments.length,
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "270px 1fr",
          minHeight: "100vh",
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 86,
            height: "calc(100vh - 86px)",
            background: "rgba(255,255,255,.96)",
            borderRight: "1px solid #e7ecf4",
            padding: "22px 18px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "linear-gradient(135deg,#355df6,#7c3aed)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
              }}
            >
              🎓
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, letterSpacing: "-.04em" }}>
                Academy OS
              </h2>
              <p
                style={{
                  margin: "3px 0 0",
                  color: "#475569",
                  fontWeight: 750,
                  fontSize: 12,
                }}
              >
                Command Center
              </p>
            </div>
          </div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 950,
              color: "#355df6",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              margin: "0 0 10px",
            }}
          >
            Academy
          </p>
          <nav style={{ display: "grid", gap: 5 }}>
            {sidebarItems
              .filter((i: SidebarItem) => i.group === "academy")
              .map((item: SidebarItem) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 42,
                    padding: "0 12px",
                    borderRadius: 13,
                    textDecoration: "none",
                    color:
                      item.href === "/academy/enrollments"
                        ? "#355df6"
                        : "#1e293b",
                    background:
                      item.href === "/academy/enrollments"
                        ? "#ede9fe"
                        : "transparent",
                    fontWeight: 850,
                    fontSize: 14,
                  }}
                >
                  <span style={{ width: 20, textAlign: "center" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
          </nav>
          <p
            style={{
              fontSize: 11,
              fontWeight: 950,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              margin: "24px 0 10px",
            }}
          >
            System
          </p>
          <nav style={{ display: "grid", gap: 5 }}>
            {sidebarItems
              .filter((i: SidebarItem) => i.group === "system")
              .map((item: SidebarItem) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 42,
                    padding: "0 12px",
                    borderRadius: 13,
                    textDecoration: "none",
                    color: "#1e293b",
                    fontWeight: 850,
                    fontSize: 14,
                  }}
                >
                  <span style={{ width: 20, textAlign: "center" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
          </nav>
          <Card style={{ padding: 16, marginTop: 26, borderRadius: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 22 }}>🎓</span>
              <div>
                <strong style={{ fontSize: 14 }}>Academy OS</strong>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 750,
                  }}
                >
                  Live System
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 8,
                alignItems: "center",
                color: "#16a34a",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              />{" "}
              Online
            </div>
            <p
              style={{
                margin: "8px 0 12px",
                color: "#334155",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              All systems operational
            </p>
            <Link
              href="/academy/command-center"
              style={{
                display: "block",
                borderRadius: 13,
                background: "#eef2f7",
                padding: "12px 14px",
                textAlign: "center",
                color: "#334155",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              View System Status
            </Link>
          </Card>
        </aside>

        <section style={{ padding: 26, overflow: "hidden" }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>▣</span>
                <h1
                  style={{ margin: 0, fontSize: 30, letterSpacing: "-.06em" }}
                >
                  Enrollment Management Center
                </h1>
                <Pill tone="blue">live</Pill>
              </div>
              <p
                style={{ margin: "8px 0 0", color: "#64748b", fontWeight: 780 }}
              >
                Real-time Academy enrollment control, conversion, groups,
                payment protection, attendance readiness and graduation bridge.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/academy/trainees" style={topButton("#355df6")}>
                New Trainee
              </Link>
              <Link href="/academy/payments" style={topButton("#16a34a")}>
                Add Payment
              </Link>
              <Link href="/academy/reports" style={topButton("#0f172a")}>
                Reports
              </Link>
            </div>
          </header>

          <Card style={{ padding: 14, marginBottom: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "170px repeat(6,1fr)",
                gap: 10,
                alignItems: "center",
              }}
            >
              <strong style={{ paddingLeft: 8 }}>Smart Actions ›</strong>
              {[
                ["Validate Queue", "/academy/eligibility", "#f97316"],
                ["Enroll Candidate", "#create-enrollment", "#7c3aed"],
                ["Assign Group", "/academy/locations-groups", "#0891b2"],
                ["Payment Control", "/academy/payments", "#16a34a"],
                ["Track Attendance", "/academy/attendance", "#0f172a"],
                ["Graduation Bridge", "/academy/graduation", "#db2777"],
              ].map(([label, href, color]) => (
                <Link key={label} href={href} style={topButton(color)}>
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,minmax(0,1fr))",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <Kpi
              icon="📥"
              label="Total Enrollments"
              value={String(enrollments.length)}
              sub="academy_enrollments"
              tone="blue"
            />
            <Kpi
              icon="✅"
              label="Active / Confirmed"
              value={String(activeEnrollments.length)}
              sub="live in training"
              tone="green"
            />
            <Kpi
              icon="⏳"
              label="Pending Queue"
              value={String(pendingEnrollments.length)}
              sub="needs action"
              tone="orange"
            />
            <Kpi
              icon="⚠️"
              label="Risk / Blocked"
              value={String(riskyEnrollments.length)}
              sub="manager escalation"
              tone="red"
            />
            <Kpi
              icon="💳"
              label="Payment Coverage"
              value={`${paymentCoverage}%`}
              sub={money(paidTotal)}
              tone="violet"
            />
            <Kpi
              icon="🎓"
              label="Graduation Bridge"
              value={`${certificateReadiness}%`}
              sub="certificate-ready"
              tone="cyan"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr .85fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Card id="create-enrollment" style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 01"
                title="Create Live Enrollment"
                subtitle="Enroll an eligible trainee into the correct program, group and operational lifecycle. This uses your existing server action and syncs to Academy records."
              />
              <form
                action={createEnrollment}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 13,
                }}
              >
                <InputShell>
                  Approved Trainee
                  <select name="trainee_id" required style={fieldStyle}>
                    <option value="">Select approved trainee</option>
                    {eligible.map((t: AnyRow) => (
                      <option key={t.id} value={t.id}>
                        {s(t.full_name)} ·{" "}
                        {s(t.serial_number || t.phone || t.city)} ·{" "}
                        {s(t.eligibility_status || t.status)}
                      </option>
                    ))}
                  </select>
                </InputShell>
                <InputShell>
                  Course
                  <select name="course_id" style={fieldStyle}>
                    <option value="">No course assigned yet</option>
                    {courses.map((c: AnyRow) => (
                      <option key={c.id} value={c.id}>
                        {s(c.title || c.name)}
                      </option>
                    ))}
                  </select>
                </InputShell>
                <InputShell>
                  Group / Cohort
                  <select name="group_id" style={fieldStyle}>
                    <option value="">No group assigned yet</option>
                    {groups.map((g: AnyRow) => (
                      <option key={g.id} value={g.id}>
                        {s(g.name || g.title)} · capacity{" "}
                        {s(g.capacity || g.max_capacity || "—")}
                      </option>
                    ))}
                  </select>
                </InputShell>
                <InputShell>
                  Status
                  <select
                    name="status"
                    defaultValue="enrolled"
                    style={fieldStyle}
                  >
                    {enrollmentStatuses.map((x: string) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </InputShell>
                <InputShell>
                  <span>Operational Note</span>
                  <textarea
                    name="note"
                    rows={4}
                    placeholder="Admission source, course expectations, missing documents, payment condition, manager instruction..."
                    style={{
                      ...fieldStyle,
                      minHeight: 108,
                      resize: "vertical",
                      gridColumn: "1 / -1",
                    }}
                  />
                </InputShell>
                <button
                  style={{
                    gridColumn: "1 / -1",
                    border: 0,
                    borderRadius: 17,
                    padding: 16,
                    color: "#fff",
                    background: "linear-gradient(135deg,#355df6,#7c3aed)",
                    fontWeight: 1000,
                    fontSize: 15,
                    boxShadow: "0 18px 35px rgba(53,93,246,.24)",
                  }}
                >
                  Create enrollment + sync pipeline
                </button>
              </form>
            </Card>

            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 02"
                title="Conversion Trend"
                subtitle="Last 14 days enrollment creation movement from live database."
              />
              <TrendBars values={monthlyTrend} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                {[
                  ["Eligible", eligible.length, "blue"],
                  ["Unassigned", unassigned, "orange"],
                  ["Completed", completedEnrollments.length, "green"],
                ].map(([a, b, c]) => (
                  <div
                    key={String(a)}
                    style={{
                      border: "1px solid #e7ecf4",
                      borderRadius: 16,
                      padding: 13,
                    }}
                  >
                    <Pill tone={c as Tone}>{a}</Pill>
                    <strong
                      style={{ display: "block", marginTop: 8, fontSize: 24 }}
                    >
                      {b}
                    </strong>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 03"
                title="Lifecycle Status Board"
                subtitle="Enrollment status distribution and operational pressure."
              />
              <div style={{ display: "grid", gap: 13 }}>
                {statusCounts.map((row: { status: string; count: number }) => (
                  <div
                    key={row.status}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "115px 1fr 42px",
                      gap: 11,
                      alignItems: "center",
                    }}
                  >
                    <Pill tone={statusTone(row.status)}>{row.status}</Pill>
                    <Progress
                      value={pct(row.count, Math.max(1, enrollments.length))}
                      tone={statusTone(row.status)}
                    />
                    <strong style={{ textAlign: "right" }}>{row.count}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr .7fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 04"
                title="Live Enrollment Registry"
                subtitle="Operational enrollment files with trainee, course, group, payment, attendance and dossier actions."
                action={
                  <Link href="/academy/trainees" style={smallLink}>
                    Open trainees
                  </Link>
                }
              />
              <div
                style={{
                  border: "1px solid #e7ecf4",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr .9fr .8fr .65fr .75fr .65fr",
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 1000,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                  }}
                >
                  <HeaderCell>Trainee</HeaderCell>
                  <HeaderCell>Course</HeaderCell>
                  <HeaderCell>Group</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Signals</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                </div>
                {recentEnrollments.length ? (
                  recentEnrollments.map((e: AnyRow) => {
                    const traineeName = nameOf(
                      trainees,
                      e.trainee_id,
                      "Unknown trainee",
                    );
                    const pay = paymentByTrainee.get(String(e.trainee_id)) || 0;
                    const attend =
                      attendanceCountByTrainee.get(String(e.trainee_id)) || 0;
                    return (
                      <div
                        key={e.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1.1fr .9fr .8fr .65fr .75fr .65fr",
                          borderTop: "1px solid #eef2f7",
                          alignItems: "center",
                          minHeight: 76,
                        }}
                      >
                        <Cell>
                          <div
                            style={{
                              display: "flex",
                              gap: 11,
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 15,
                                background: "#eef2ff",
                                color: "#355df6",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 1000,
                              }}
                            >
                              {initials(traineeName)}
                            </span>
                            <span>
                              <strong>{traineeName}</strong>
                              <small
                                style={{
                                  display: "block",
                                  marginTop: 4,
                                  color: "#64748b",
                                  fontWeight: 800,
                                }}
                              >
                                {date(e.created_at)} · {s(e.id).slice(0, 8)}
                              </small>
                            </span>
                          </div>
                        </Cell>
                        <Cell>
                          {nameOf(courses, e.course_id, "Course not assigned")}
                        </Cell>
                        <Cell>
                          {nameOf(groups, e.group_id, "Group not assigned")}
                        </Cell>
                        <Cell>
                          <Pill tone={statusTone(e.status)}>
                            {s(e.status, "pending")}
                          </Pill>
                        </Cell>
                        <Cell>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <Pill tone={pay ? "green" : "orange"}>
                              {pay ? money(pay) : "unpaid"}
                            </Pill>
                            <Pill tone={attend ? "blue" : "slate"}>
                              {attend} att.
                            </Pill>
                          </div>
                        </Cell>
                        <Cell>
                          <Link
                            href={`/academy/enrollments?enrollment_id=${e.id}`}
                            style={smallLink}
                          >
                            Open
                          </Link>
                        </Cell>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{ padding: 30, color: "#64748b", fontWeight: 850 }}
                  >
                    No enrollment records yet. Create the first enrollment from
                    the command form above.
                  </div>
                )}
              </div>
            </Card>

            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 05"
                title="Risk & Exception Control"
                subtitle="Smart control cards for enrollment blockers and manager intervention."
              />
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  [
                    "Missing group assignment",
                    unassigned,
                    "Assign group before operational start.",
                    "orange",
                    "/academy/locations-groups",
                  ],
                  [
                    "Payment not linked",
                    Math.max(
                      0,
                      enrollments.length -
                        Array.from(paymentByTrainee.keys()).length,
                    ),
                    "Push payment control before certificate path.",
                    "red",
                    "/academy/payments",
                  ],
                  [
                    "Attendance not started",
                    Math.max(
                      0,
                      enrollments.length -
                        Array.from(attendanceCountByTrainee.keys()).length,
                    ),
                    "Check course start and trainer confirmation.",
                    "violet",
                    "/academy/attendance",
                  ],
                  [
                    "Certificate ready bridge",
                    certificates.length,
                    "Review completion and issue certificate.",
                    "green",
                    "/academy/certificates",
                  ],
                ].map(([title, count, sub, tone, href]) => (
                  <Link
                    key={String(title)}
                    href={String(href)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "45px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      textDecoration: "none",
                      color: "#0f172a",
                      border: "1px solid #e7ecf4",
                      borderRadius: 18,
                      padding: 13,
                    }}
                  >
                    <Icon tone={tone as Tone}>{String(count)}</Icon>
                    <span>
                      <strong style={{ display: "block" }}>{title}</strong>
                      <small style={{ color: "#64748b", fontWeight: 800 }}>
                        {sub}
                      </small>
                    </span>
                    <span style={{ color: "#94a3b8", fontWeight: 1000 }}>
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 06"
                title="Group Capacity Monitor"
                subtitle="Control cohort capacity, overbooking and assignment health."
              />
              {groupLoad.length ? (
                <div style={{ display: "grid", gap: 13 }}>
                  {groupLoad.map(({ group, count, capacity, fill }) => (
                    <Link
                      key={group.id}
                      href="/academy/locations-groups"
                      style={{
                        textDecoration: "none",
                        color: "#0f172a",
                        display: "grid",
                        gap: 8,
                        border: "1px solid #eef2f7",
                        borderRadius: 16,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <strong>{s(group.name || group.title)}</strong>
                        <Pill
                          tone={
                            fill > 90 ? "red" : fill > 70 ? "orange" : "green"
                          }
                        >
                          {count}/{capacity}
                        </Pill>
                      </div>
                      <Progress
                        value={fill}
                        tone={
                          fill > 90 ? "red" : fill > 70 ? "orange" : "green"
                        }
                      />
                      <small style={{ color: "#64748b", fontWeight: 850 }}>
                        {s(
                          group.city ||
                            group.location ||
                            nameOf(locations, group.location_id),
                          "Location pending",
                        )}
                      </small>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty text="No groups yet. Create groups to activate capacity monitoring." />
              )}
            </Card>

            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 07"
                title="Course Demand & Revenue"
                subtitle="Live course enrollment load, completion ratio and linked revenue."
              />
              {courseLoad.length ? (
                <div style={{ display: "grid", gap: 13 }}>
                  {courseLoad.map(({ course, count, revenue, completion }) => (
                    <Link
                      key={course.id}
                      href={`/academy/courses/${course.id}`}
                      style={{
                        textDecoration: "none",
                        color: "#0f172a",
                        display: "grid",
                        gap: 8,
                        border: "1px solid #eef2f7",
                        borderRadius: 16,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <strong>{s(course.title || course.name)}</strong>
                        <Pill tone="blue">{count} enrolled</Pill>
                      </div>
                      <Progress value={completion} tone="violet" />
                      <small style={{ color: "#64748b", fontWeight: 850 }}>
                        {money(revenue)} · {completion}% completion
                      </small>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty text="No courses yet. Add programs to activate demand monitoring." />
              )}
            </Card>

            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 08"
                title="Sync Coverage Matrix"
                subtitle="Every enrollment should connect to payment, attendance and certificate outcomes."
              />
              <div style={{ display: "grid", gap: 16 }}>
                {[
                  [
                    "Payment Sync",
                    paymentCoverage,
                    "green",
                    "/academy/payments",
                  ],
                  [
                    "Attendance Sync",
                    attendanceCoverage,
                    "cyan",
                    "/academy/attendance",
                  ],
                  [
                    "Certificate Sync",
                    certificateReadiness,
                    "orange",
                    "/academy/certificates",
                  ],
                  [
                    "Risk Cleanup",
                    pct(
                      enrollments.length - riskyEnrollments.length,
                      Math.max(1, enrollments.length),
                    ),
                    "violet",
                    "/academy/control-tickets",
                  ],
                ].map(([label, value, tone, href]) => (
                  <Link
                    href={String(href)}
                    key={String(label)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "105px 1fr 45px",
                      gap: 12,
                      alignItems: "center",
                      color: "#0f172a",
                      textDecoration: "none",
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>{label}</strong>
                    <Progress value={Number(value)} tone={tone as Tone} />
                    <Pill tone={tone as Tone}>{value}%</Pill>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: ".85fr 1.15fr",
              gap: 16,
            }}
          >
            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 09"
                title="Eligible Trainee Queue"
                subtitle="Approved trainees ready for enrollment conversion."
              />
              {eligible.slice(0, 7).length ? (
                <div style={{ display: "grid", gap: 11 }}>
                  {eligible.slice(0, 7).map((t: AnyRow) => (
                    <Link
                      key={t.id}
                      href={`/academy/trainees/${t.id}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "42px 1fr auto",
                        gap: 11,
                        alignItems: "center",
                        border: "1px solid #eef2f7",
                        borderRadius: 16,
                        padding: 12,
                        textDecoration: "none",
                        color: "#0f172a",
                      }}
                    >
                      <span
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 15,
                          background: "#eef2ff",
                          color: "#355df6",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 1000,
                        }}
                      >
                        {initials(s(t.full_name))}
                      </span>
                      <span>
                        <strong>{s(t.full_name)}</strong>
                        <small
                          style={{
                            display: "block",
                            marginTop: 3,
                            color: "#64748b",
                            fontWeight: 800,
                          }}
                        >
                          {s(t.city)} · {s(t.phone)}
                        </small>
                      </span>
                      <Pill tone={statusTone(t.eligibility_status || t.status)}>
                        {s(t.eligibility_status || t.status)}
                      </Pill>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty text="No eligible trainees available for enrollment yet." />
              )}
            </Card>

            <Card style={{ padding: 24 }}>
              <SectionTitle
                eyebrow="section 10"
                title="Latest Operational Sync Signals"
                subtitle="Recent audit, alerts and automation evidence for enrollment governance."
                action={
                  <Link href="/academy/audit" style={smallLink}>
                    Audit log
                  </Link>
                }
              />
              {latestSignals.length ? (
                <div style={{ display: "grid", gap: 11 }}>
                  {latestSignals.map((row, index) => (
                    <div
                      key={`${row.id || index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "45px 1fr auto",
                        gap: 12,
                        alignItems: "center",
                        border: "1px solid #eef2f7",
                        borderRadius: 16,
                        padding: 13,
                      }}
                    >
                      <Icon tone={index % 2 ? "violet" : "blue"}>
                        {index + 1}
                      </Icon>
                      <span>
                        <strong style={{ display: "block" }}>
                          {s(
                            row.title || row.action || row.event || row.kind,
                            "Academy sync event",
                          )}
                        </strong>
                        <small style={{ color: "#64748b", fontWeight: 800 }}>
                          {s(
                            row.notes ||
                              row.description ||
                              row.entity ||
                              row.message,
                            "Live Academy event captured",
                          )}
                        </small>
                      </span>
                      <small style={{ color: "#94a3b8", fontWeight: 900 }}>
                        {date(row.created_at)}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="No recent sync signals yet. Events will appear here after operational activity." />
              )}
            </Card>
          </div>
        </section>
        {selectedEnrollment ? (
          <EnrollmentLiveModal
            enrollment={selectedEnrollment}
            trainees={trainees}
            courses={courses}
            groups={groups}
            payments={payments}
            attendance={attendance}
            certificates={certificates}
          />
        ) : null}
      </div>
    </main>
  );
}

function EnrollmentLiveModal({
  enrollment,
  trainees,
  courses,
  groups,
  payments,
  attendance,
  certificates,
}: {
  enrollment: AnyRow;
  trainees: AnyRow[];
  courses: AnyRow[];
  groups: AnyRow[];
  payments: AnyRow[];
  attendance: AnyRow[];
  certificates: AnyRow[];
}) {
  const trainee =
    trainees.find((row: AnyRow) => String(row.id) === String(enrollment.trainee_id)) ||
    {};
  const traineeName = s(trainee.full_name, "Unknown trainee");
  const paid = payments
    .filter(
      (row) =>
        String(row.trainee_id) === String(enrollment.trainee_id) ||
        String(row.enrollment_id) === String(enrollment.id),
    )
    .reduce(
      (sum, row) =>
        sum +
        n(row.amount || row.amount_mad || row.paid_amount || row.total_amount),
      0,
    );
  const presence = attendance.filter(
    (row) =>
      String(row.trainee_id) === String(enrollment.trainee_id) ||
      String(row.enrollment_id) === String(enrollment.id),
  ).length;
  const certs = certificates.filter(
    (row) =>
      String(row.trainee_id) === String(enrollment.trainee_id) ||
      String(row.enrollment_id) === String(enrollment.id),
  ).length;
  const currentCourse = nameOf(
    courses,
    enrollment.course_id,
    "Course not assigned",
  );
  const currentGroup = nameOf(
    groups,
    enrollment.group_id,
    "Group not assigned",
  );
  const status = s(enrollment.status, "enrolled");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15,23,42,.38)",
        backdropFilter: "blur(9px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "105px 26px 36px",
        overflowY: "auto",
      }}
    >
      <section
        style={{
          width: "min(1180px, 100%)",
          background: "#fff",
          border: "1px solid #e7ecf4",
          borderRadius: 34,
          boxShadow: "0 38px 100px rgba(15,23,42,.22)",
          overflow: "hidden",
        }}
      >
        <form action={updateEnrollmentDossierAction}>
          <input
            type="hidden"
            name="enrollment_id"
            value={s(enrollment.id, "")}
          />
          <input
            type="hidden"
            name="trainee_id"
            value={s(enrollment.trainee_id, "")}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              alignItems: "center",
              padding: "24px 28px",
              borderBottom: "1px solid #eef2f7",
              background: "linear-gradient(135deg,#ffffff,#f8fbff)",
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  background: "#eef2ff",
                  color: "#355df6",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 1000,
                  fontSize: 20,
                }}
              >
                {initials(traineeName)}
              </span>
              <div>
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#355df6",
                    fontSize: 11,
                    fontWeight: 1000,
                    letterSpacing: ".13em",
                    textTransform: "uppercase",
                  }}
                >
                  Live synced enrollment dossier
                </p>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                    letterSpacing: "-.055em",
                    color: "#0f172a",
                  }}
                >
                  {traineeName}
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  Enrollment ID {s(enrollment.id).slice(0, 8)} · {currentCourse}{" "}
                  · {currentGroup}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="submit"
                style={{ ...topButton("#355df6"), minWidth: 120 }}
              >
                Save
              </button>
              <Link
                href="/academy/enrollments"
                style={{ ...smallLink, color: "#0f172a", minHeight: 42 }}
              >
                Cancel
              </Link>
            </div>
          </div>

          <div style={{ padding: 28, display: "grid", gap: 18 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,minmax(0,1fr))",
                gap: 14,
              }}
            >
              <DossierKpi
                icon="▣"
                label="Status"
                value={status}
                tone={statusTone(status)}
              />
              <DossierKpi
                icon="🎓"
                label="Course"
                value={currentCourse}
                tone="violet"
              />
              <DossierKpi
                icon="👥"
                label="Group"
                value={currentGroup}
                tone="cyan"
              />
              <DossierKpi
                icon="💳"
                label="Paid"
                value={money(paid)}
                tone={paid ? "green" : "orange"}
              />
              <DossierKpi
                icon="☑"
                label="Attendance"
                value={String(presence)}
                tone={presence ? "blue" : "slate"}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}
            >
              <Card style={{ padding: 22 }}>
                <SectionTitle
                  eyebrow="section 01"
                  title="Editable enrollment control"
                  subtitle="Update the live enrollment record. Saving syncs the enrollment, trainee status, audit logs and Academy dashboard."
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 13,
                  }}
                >
                  <InputShell>
                    Course
                    <select
                      name="course_id"
                      defaultValue={s(enrollment.course_id, "")}
                      style={fieldStyle}
                    >
                      <option value="">Course not assigned</option>
                      {courses.map((c: AnyRow) => (
                        <option key={c.id} value={c.id}>
                          {s(c.title || c.name)}
                        </option>
                      ))}
                    </select>
                  </InputShell>
                  <InputShell>
                    Group / Cohort
                    <select
                      name="group_id"
                      defaultValue={s(enrollment.group_id, "")}
                      style={fieldStyle}
                    >
                      <option value="">Group not assigned</option>
                      {groups.map((g: AnyRow) => (
                        <option key={g.id} value={g.id}>
                          {s(g.name || g.title)} · capacity{" "}
                          {s(g.capacity || g.max_capacity || "—")}
                        </option>
                      ))}
                    </select>
                  </InputShell>
                  <InputShell>
                    Status
                    <select
                      name="status"
                      defaultValue={status}
                      style={fieldStyle}
                    >
                      {enrollmentStatuses.map((item: string) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </InputShell>
                  <InputShell>
                    Certificate Bridge
                    <input
                      readOnly
                      value={
                        certs
                          ? `${certs} certificate record`
                          : "No certificate yet"
                      }
                      style={{ ...fieldStyle, background: "#f8fafc" }}
                    />
                  </InputShell>
                  <InputShell>
                    <span>Manager note / operational instruction</span>
                    <textarea
                      name="note"
                      defaultValue={
                        s(enrollment.note || enrollment.notes, "") === "—"
                          ? ""
                          : s(enrollment.note || enrollment.notes, "")
                      }
                      rows={5}
                      placeholder="Course change, payment condition, group transfer, attendance blocker, certificate readiness..."
                      style={{
                        ...fieldStyle,
                        minHeight: 132,
                        resize: "vertical",
                        gridColumn: "1 / -1",
                      }}
                    />
                  </InputShell>
                </div>
              </Card>

              <Card style={{ padding: 22 }}>
                <SectionTitle
                  eyebrow="section 02"
                  title="Trainee sync intelligence"
                  subtitle="Current trainee identity, eligibility, payment and training signals used by Academy operations."
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <InfoBox label="Full name" value={traineeName} />
                  <InfoBox label="Phone" value={s(trainee.phone)} />
                  <InfoBox label="City" value={s(trainee.city)} />
                  <InfoBox
                    label="Eligibility"
                    value={s(trainee.eligibility_status || trainee.status)}
                  />
                  <InfoBox
                    label="Payment"
                    value={paid ? money(paid) : "No payment linked"}
                  />
                  <InfoBox label="Attendance" value={`${presence} records`} />
                </div>
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <Link
                    href={`/academy/trainees?trainee_id=${enrollment.trainee_id}`}
                    style={smallLink}
                  >
                    Open trainee dossier
                  </Link>
                  <Link
                    href="/academy/payments"
                    style={{ ...smallLink, color: "#16a34a" }}
                  >
                    Go to payment control
                  </Link>
                  <Link
                    href="/academy/attendance"
                    style={{ ...smallLink, color: "#0891b2" }}
                  >
                    Go to attendance tracking
                  </Link>
                </div>
              </Card>
            </div>

            <Card style={{ padding: 22 }}>
              <SectionTitle
                eyebrow="section 03"
                title="Operational lifecycle bridge"
                subtitle="Enterprise-level checklist for keeping the enrollment real, synced and ready for team execution."
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <BridgeCard
                  label="Course assignment"
                  value={enrollment.course_id ? "Connected" : "Missing"}
                  tone={enrollment.course_id ? "green" : "orange"}
                />
                <BridgeCard
                  label="Group placement"
                  value={enrollment.group_id ? "Connected" : "Missing"}
                  tone={enrollment.group_id ? "green" : "orange"}
                />
                <BridgeCard
                  label="Payment bridge"
                  value={paid ? "Linked" : "Unpaid"}
                  tone={paid ? "green" : "red"}
                />
                <BridgeCard
                  label="Training presence"
                  value={presence ? "Started" : "Not started"}
                  tone={presence ? "blue" : "slate"}
                />
              </div>
            </Card>
          </div>
        </form>
      </section>
    </div>
  );
}

function DossierKpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
        <Icon tone={tone}>{icon}</Icon>
        <span style={{ minWidth: 0 }}>
          <small
            style={{ display: "block", color: "#64748b", fontWeight: 950 }}
          >
            {label}
          </small>
          <strong
            style={{
              display: "block",
              marginTop: 4,
              fontSize: 18,
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </strong>
        </span>
      </div>
    </Card>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e7ecf4",
        borderRadius: 17,
        padding: 14,
        background: "#fbfdff",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#64748b",
          fontSize: 10,
          fontWeight: 1000,
          letterSpacing: ".1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </small>
      <strong
        style={{
          display: "block",
          marginTop: 7,
          color: "#0f172a",
          fontSize: 14,
          wordBreak: "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function BridgeCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div
      style={{
        border: "1px solid #e7ecf4",
        borderRadius: 18,
        padding: 16,
        background: "#fff",
      }}
    >
      <Pill tone={tone}>{value}</Pill>
      <strong style={{ display: "block", marginTop: 11, color: "#0f172a" }}>
        {label}
      </strong>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "14px 15px" }}>{children}</div>;
}
function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 15px", fontWeight: 850 }}>{children}</div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: 18,
        padding: 24,
        color: "#64748b",
        fontWeight: 850,
        background: "#f8fafc",
      }}
    >
      {text}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "14px 15px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 850,
  outline: "none",
  boxSizing: "border-box",
};
const smallLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#355df6",
  borderRadius: 13,
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 13,
};
function topButton(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    borderRadius: 14,
    background: color,
    color: "#fff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 1000,
    boxShadow: `0 16px 28px ${color}22`,
    border: 0,
    padding: "0 16px",
    whiteSpace: "nowrap",
  };
}
