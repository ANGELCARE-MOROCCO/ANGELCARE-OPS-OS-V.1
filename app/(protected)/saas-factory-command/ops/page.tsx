export default function SaasFactoryOpsPage() {
  const cards = [
    {
      title: "Run Probes",
      description: "Execute Phase 7 default endpoint probes and write probe results.",
      url: "/api/saas-factory/ops/probes/run",
      method: "GET",
    },
    {
      title: "Probe Results",
      description: "Read the latest SaaS Factory probe result records.",
      url: "/api/saas-factory/ops/probes/results",
      method: "GET",
    },
    {
      title: "Module Snapshot",
      description: "Build module status snapshot from module registry and latest probes.",
      url: "/api/saas-factory/ops/modules/snapshot",
      method: "GET",
    },
    {
      title: "Audit Export",
      description: "Export latest audit events as JSON.",
      url: "/api/saas-factory/ops/audit/export",
      method: "GET",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 80% -10%, rgba(14,165,233,.14), transparent 34rem), radial-gradient(circle at 10% 0%, rgba(124,58,237,.18), transparent 30rem), #020617",
        color: "#e5eefc",
        padding: 24,
      }}
    >
      <section
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          border: "1px solid rgba(148,163,184,.16)",
          borderRadius: 20,
          padding: 22,
          background: "linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.86))",
        }}
      >
        <p style={{ margin: 0, color: "#38bdf8", fontSize: 11, fontWeight: 900, letterSpacing: ".18em" }}>
          PHASE 7 OPERATIONS
        </p>
        <h1 style={{ margin: "8px 0 6px", color: "#fff", fontSize: 32 }}>
          SaaS Factory Operations Execution Layer
        </h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Probes, queue controls, incident generation, module snapshots and audit export.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginTop: 20,
          }}
        >
          {cards.map((card) => (
            <a
              key={card.url}
              href={card.url}
              target="_blank"
              style={{
                textDecoration: "none",
                color: "#e5eefc",
                border: "1px solid rgba(148,163,184,.14)",
                borderRadius: 16,
                padding: 16,
                background: "rgba(2,6,23,.42)",
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong style={{ color: "#fff", fontSize: 17 }}>{card.title}</strong>
                <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{card.description}</p>
              </div>
              <code style={{ color: "#bae6fd", fontSize: 12 }}>{card.method} {card.url}</code>
            </a>
          ))}
        </div>

        <pre
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(148,163,184,.14)",
            background: "rgba(2,6,23,.65)",
            color: "#dbeafe",
            overflowX: "auto",
          }}
        >
{`curl -X POST http://localhost:3000/api/saas-factory/ops/queue/enqueue \\
  -H "Content-Type: application/json" \\
  -d '{"queue_name":"factory-ops","job_type":"manual_probe_refresh","priority":"high"}'

curl -X POST http://localhost:3000/api/saas-factory/ops/queue/process \\
  -H "Content-Type: application/json" \\
  -d '{"limit":10}'`}
        </pre>
      </section>
    </main>
  );
}
