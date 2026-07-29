"use client";

import Link from "next/link";
import { BadgeCheck, ChevronRight, CircleDashed, ShieldAlert, TimerReset, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./certification-pulse.module.css";

type Row = Record<string, unknown>;
type CertificationStatus = "CERTIFIED" | "PARTIALLY CERTIFIED" | "BLOCKED" | "FAILED" | "NOT TESTED";

const text = (value: unknown) => String(value ?? "").trim();
const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const status = (value: unknown): CertificationStatus => {
  const candidate = text(value).toUpperCase();
  if (candidate === "CERTIFIED") return "CERTIFIED";
  if (candidate === "PARTIALLY CERTIFIED") return "PARTIALLY CERTIFIED";
  if (candidate === "BLOCKED") return "BLOCKED";
  if (candidate === "FAILED") return "FAILED";
  return "NOT TESTED";
};

function Icon({ value }: { value: CertificationStatus }) {
  if (value === "CERTIFIED") return <BadgeCheck size={16} />;
  if (value === "PARTIALLY CERTIFIED") return <CircleDashed size={16} />;
  if (value === "BLOCKED") return <ShieldAlert size={16} />;
  if (value === "FAILED") return <XCircle size={16} />;
  return <TimerReset size={16} />;
}

export function CertificationPulse({ workspaceKey }: { workspaceKey: string }) {
  const [row, setRow] = useState<Row | null>(null);
  const [contract, setContract] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    void fetch(`/api/ac-capital-os/certification?mode=pulse&workspaceKey=${encodeURIComponent(workspaceKey)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) return;
        if (!cancelled) {
          const data = record(payload.data);
          setRow(data.certification ? record(data.certification) : null);
          setContract(data.contract ? record(data.contract) : null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [workspaceKey]);

  const current = status(row?.status);
  const metrics = record(row?.metrics);
  const certified = Number(metrics.certified || 0);
  const total = Number(metrics.totalChecks || 0);
  const copy = row
    ? current === "CERTIFIED"
      ? "All mandatory workspace gates have live evidence."
      : `${certified}/${total || 11} gates certified · board release remains controlled.`
    : "Live workspace certification has not been established.";

  return (
    <Link className={styles.pulse} data-status={current} href="/ac-capital-os/certification">
      <span className={styles.icon}><Icon value={current} /></span>
      <div>
        <span>IC10 WORKSPACE ASSURANCE</span>
        <strong>{text(contract?.label || row?.workspace_label || workspaceKey.replaceAll("-", " "))}</strong>
        <small>{copy}</small>
      </div>
      <b>{current}</b>
      <ChevronRight size={15} />
    </Link>
  );
}
