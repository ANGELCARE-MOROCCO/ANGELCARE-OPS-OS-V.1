
"use client"

export default function IncentivesSafetySnapshotHardFix() {
  return (
    <div className="rounded-[36px] border border-slate-800 bg-[#020617] p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <div
            style={{
              color: "#ffffff",
              letterSpacing: "0.28em",
              fontWeight: 900,
              fontSize: 12,
              textTransform: "uppercase",
            }}
          >
            SAFETY SNAPSHOT
          </div>

          <h2
            style={{
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1,
              marginTop: 10,
            }}
          >
            No-Mistake Control
          </h2>
        </div>

        <div className="rounded-[24px] border border-orange-400/40 bg-orange-500/10 p-5">
          <span style={{ color: "#fdba74", fontSize: 42 }}>🔒</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-5">
        {[
          ["84%", "PROOF GATE"],
          ["96%", "AUDIT"],
          ["71%", "BUDGET"],
          ["2", "RISK"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-[28px] border border-white/10 bg-white/10 p-6"
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: 56,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {value}
            </div>

            <div
              style={{
                color: "#fdba74",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.16em",
                marginTop: 12,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
