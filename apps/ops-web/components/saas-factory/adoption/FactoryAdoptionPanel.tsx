"use client";

import { useEffect, useMemo, useState } from "react";

type AdoptionPlanRow = {
  moduleKey: string;
  moduleLabel: string;
  routePrefix: string;
  recommendedGroups: string[];
  findingCount: number;
  critical: number;
  high: number;
  normal: number;
  firstFiles: string[];
  nextAction: string;
};

export default function FactoryAdoptionPanel() {
  const [rows, setRows] = useState<AdoptionPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/saas-factory/adoption/plan", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || "Failed to load adoption plan");
      }
      setRows(Array.isArray(data.plan) ? data.plan : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.findings += row.findingCount;
          acc.critical += row.critical;
          acc.high += row.high;
          acc.normal += row.normal;
          return acc;
        },
        { findings: 0, critical: 0, high: 0, normal: 0 }
      ),
    [rows]
  );

  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        background: "linear-gradient(180deg, rgba(15,23,42,.88), rgba(2,6,23,.86))",
        borderRadius: 18,
        padding: 18,
        color: "#e5eefc",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, color: "#8b5cf6", fontSize: 11, fontWeight: 900, letterSpacing: ".18em" }}>
            PHASE 5 ADOPTION
          </p>
          <h2 style={{ margin: "6px 0 4px", color: "#fff", fontSize: 24 }}>Factory Live Option Adoption Plan</h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Scanner-based rollout plan for replacing hardcoded fields with SaaS Factory live registries.
          </p>
        </div>

        <button
          onClick={refresh}
          style={{
            border: "1px solid rgba(168,85,247,.42)",
            borderRadius: 12,
            background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
            color: "#fff",
            padding: "10px 14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {loading ? "Scanning..." : "Refresh Scan"}
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 14, color: "#fca5a5", fontSize: 13 }}>{error}</div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
        {[
          ["Findings", totals.findings],
          ["Critical", totals.critical],
          ["High", totals.high],
          ["Normal", totals.normal],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid rgba(148,163,184,.12)",
              borderRadius: 14,
              padding: 14,
              background: "rgba(2,6,23,.42)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em" }}>
              {label}
            </div>
            <strong style={{ display: "block", marginTop: 8, color: "#fff", fontSize: 26 }}>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "#94a3b8", textAlign: "left" }}>
              <th style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.12)" }}>Module</th>
              <th style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.12)" }}>Groups</th>
              <th style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.12)" }}>Findings</th>
              <th style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.12)" }}>First files</th>
              <th style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.12)" }}>Next action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.moduleKey}>
                <td style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.08)", color: "#fff" }}>
                  <strong>{row.moduleLabel}</strong>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{row.routePrefix}</div>
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.08)" }}>
                  {row.recommendedGroups.slice(0, 4).map((group) => (
                    <span
                      key={group}
                      style={{
                        display: "inline-block",
                        margin: "0 5px 5px 0",
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(56,189,248,.22)",
                        color: "#bae6fd",
                        background: "rgba(14,165,233,.1)",
                        fontSize: 11,
                      }}
                    >
                      {group}
                    </span>
                  ))}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.08)" }}>
                  <strong style={{ color: "#fff" }}>{row.findingCount}</strong>
                  <div style={{ color: "#fca5a5", fontSize: 11 }}>critical {row.critical}</div>
                  <div style={{ color: "#fbbf24", fontSize: 11 }}>high {row.high}</div>
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.08)", color: "#94a3b8" }}>
                  {row.firstFiles.slice(0, 3).map((file) => (
                    <div key={file} style={{ marginBottom: 4 }}>{file}</div>
                  ))}
                </td>
                <td style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.08)", color: "#dbeafe" }}>
                  {row.nextAction}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
