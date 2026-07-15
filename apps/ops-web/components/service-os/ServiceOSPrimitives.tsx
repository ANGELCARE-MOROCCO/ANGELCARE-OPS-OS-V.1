import React from "react"
import Link from "next/link"

type Tone =
  | "blue"
  | "purple"
  | "emerald"
  | "green"
  | "amber"
  | "orange"
  | "red"
  | "rose"
  | "slate"
  | "gray"
  | "cyan"
  | "indigo"
  | string

type CommonProps = {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const toneMap: Record<string, { bg: string; border: string; text: string; soft: string }> = {
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", soft: "#dbeafe" },
  purple: { bg: "#faf5ff", border: "#e9d5ff", text: "#7e22ce", soft: "#f3e8ff" },
  emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", soft: "#d1fae5" },
  green: { bg: "#ecfdf5", border: "#bbf7d0", text: "#15803d", soft: "#dcfce7" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", soft: "#fef3c7" },
  orange: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", soft: "#ffedd5" },
  red: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", soft: "#fee2e2" },
  rose: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", soft: "#ffe4e6" },
  cyan: { bg: "#ecfeff", border: "#a5f3fc", text: "#0e7490", soft: "#cffafe" },
  indigo: { bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca", soft: "#e0e7ff" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#334155", soft: "#f1f5f9" },
  gray: { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", soft: "#f3f4f6" },
}

function toneStyle(tone?: Tone) {
  return toneMap[String(tone || "slate")] || toneMap.slate
}

export function ServiceOSHeader({
  eyebrow,
  title,
  subtitle,
  description,
  actions,
  tone = "blue",
  children,
  className,
  style,
}: CommonProps & {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  tone?: Tone
}) {
  const t = toneStyle(tone)
  const body = subtitle ?? description
  return (
    <div
      className={className}
      style={{
        border: `1px solid ${t.border}`,
        background: `linear-gradient(135deg, ${t.bg}, #ffffff)`,
        borderRadius: 28,
        padding: 24,
        boxShadow: "0 14px 40px rgba(15,23,42,.08)",
        marginBottom: 18,
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          {eyebrow ? <div style={{ color: t.text, fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{eyebrow}</div> : null}
          {title ? <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1, color: "#0f172a" }}>{title}</h1> : null}
          {body ? <p style={{ margin: "10px 0 0", color: "#475569", maxWidth: 920, lineHeight: 1.6 }}>{body}</p> : null}
          {children}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
    </div>
  )
}

export function ServiceOSPanel({
  title,
  subtitle,
  description,
  eyebrow,
  actions,
  tone = "slate",
  children,
  className,
  style,
}: CommonProps & {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  tone?: Tone
}) {
  const t = toneStyle(tone)
  const body = subtitle ?? description
  return (
    <section
      className={className}
      style={{
        border: `1px solid ${t.border}`,
        background: "rgba(255,255,255,.92)",
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 10px 30px rgba(15,23,42,.06)",
        ...style,
      }}
    >
      {(title || body || eyebrow || actions) ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: children ? 14 : 0 }}>
          <div>
            {eyebrow ? <div style={{ color: t.text, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>{eyebrow}</div> : null}
            {title ? <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>{title}</h2> : null}
            {body ? <p style={{ margin: "6px 0 0", color: "#64748b", lineHeight: 1.55 }}>{body}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function ServiceOSCard({
  title,
  subtitle,
  description,
  href,
  tone = "slate",
  children,
  className,
  style,
}: CommonProps & {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  href?: string
  tone?: Tone
}) {
  const t = toneStyle(tone)
  const body = subtitle ?? description
  const inner = (
    <div
      className={className}
      style={{
        border: `1px solid ${t.border}`,
        background: "#fff",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 8px 24px rgba(15,23,42,.06)",
        height: "100%",
        ...style,
      }}
    >
      {title ? <h3 style={{ margin: 0, color: "#0f172a" }}>{title}</h3> : null}
      {body ? <p style={{ margin: "8px 0 0", color: "#64748b", lineHeight: 1.5 }}>{body}</p> : null}
      {children}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link> : inner
}

export function ServiceOSGrid({ children, columns = 3, min = 240, gap = 16, className, style }: CommonProps & { columns?: number; min?: number; gap?: number }) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(${min}px, 1fr))`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function ServiceOSPill({
  text,
  label,
  value,
  tone = "slate",
  children,
  className,
  style,
}: CommonProps & { text?: React.ReactNode; label?: React.ReactNode; value?: React.ReactNode; tone?: Tone }) {
  const t = toneStyle(tone)
  const content = children ?? text ?? label ?? value
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.text,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {content}
    </span>
  )
}

export function StatusBadge({
  status,
  label,
  text,
  value,
  tone,
  children,
  className,
  style,
}: CommonProps & { status?: string; label?: React.ReactNode; text?: React.ReactNode; value?: React.ReactNode; tone?: Tone }) {
  const normalized = String(status || text || label || value || "active").toLowerCase()
  const inferredTone: Tone = tone || (normalized.includes("risk") || normalized.includes("critical") || normalized.includes("blocked") ? "red" : normalized.includes("warn") || normalized.includes("pending") ? "amber" : normalized.includes("active") || normalized.includes("ready") || normalized.includes("ok") ? "emerald" : "slate")
  return <ServiceOSPill tone={inferredTone} text={children ?? label ?? text ?? value ?? status} className={className} style={style} />
}

export function ServiceOSKpi({
  label,
  title,
  value,
  helper,
  caption,
  subtitle,
  trend,
  tone = "slate",
  className,
  style,
}: {
  label?: React.ReactNode
  title?: React.ReactNode
  value?: React.ReactNode
  helper?: React.ReactNode
  caption?: React.ReactNode
  subtitle?: React.ReactNode
  trend?: React.ReactNode
  tone?: Tone
  className?: string
  style?: React.CSSProperties
}) {
  const t = toneStyle(tone)
  const heading = label ?? title
  const body = helper ?? caption ?? subtitle
  return (
    <div
      className={className}
      style={{
        border: `1px solid ${t.border}`,
        background: `linear-gradient(180deg, #ffffff, ${t.bg})`,
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 8px 22px rgba(15,23,42,.05)",
        ...style,
      }}
    >
      {heading ? <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>{heading}</div> : null}
      {value !== undefined ? <div style={{ color: "#0f172a", fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div> : null}
      {body ? <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{body}</div> : null}
      {trend ? <div style={{ color: t.text, fontSize: 12, fontWeight: 800, marginTop: 8 }}>{trend}</div> : null}
    </div>
  )
}

export function ServiceOSButton({
  href,
  children,
  label,
  text,
  tone = "blue",
  className,
  style,
  onClick,
  type = "button",
}: CommonProps & { href?: string; label?: React.ReactNode; text?: React.ReactNode; tone?: Tone; onClick?: React.MouseEventHandler<HTMLButtonElement>; type?: "button" | "submit" | "reset" 
  light?: boolean
  variant?: 'solid' | 'light' | 'ghost' | 'outline' | string
  disabled?: boolean
  target?: string
  rel?: string
}) {
  const t = toneStyle(tone)
  const content = children ?? label ?? text
  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: `1px solid ${t.border}`,
    background: t.text,
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    ...style,
  }
  if (href) return <Link href={href} className={className} style={buttonStyle}>{content}</Link>
  return <button type={type} onClick={onClick} className={className} style={buttonStyle}>{content}</button>
}

export function ServiceOSSection(props: React.ComponentProps<typeof ServiceOSPanel>) {
  return <ServiceOSPanel {...props} />
}

export function ServiceOSMetric(props: React.ComponentProps<typeof ServiceOSKpi>) {
  return <ServiceOSKpi {...props} />
}
