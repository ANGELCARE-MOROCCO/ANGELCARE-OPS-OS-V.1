"use client"

import { useEffect, useMemo, useState } from "react"
import { Bot, Check, Lock, Mail, Network, RefreshCw, Route, Save, Server, ShieldCheck, Sparkles } from "lucide-react"
import { defaultMailboxSetup, mailboxOnboardingSteps, type MailboxOnboardingStep } from "@/lib/email-os-core/mailbox-onboarding-model"
import { PremiumField, PremiumInput, PremiumSelect, PremiumToggle } from "./PremiumField"
import MailboxReadinessCard from "./MailboxReadinessCard"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

const icons: Record<MailboxOnboardingStep, any> = {
  identity: Mail,
  provider: Server,
  credentials: Lock,
  routing: Route,
  sync: RefreshCw,
  ai: Bot,
  security: ShieldCheck,
  review: Check
}

export default function PremiumMailboxOnboardingWizard() {
  const [step, setStep] = useState<MailboxOnboardingStep>("identity")
  const [setup, setSetup] = useState<any>(defaultMailboxSetup)
  const [profiles, setProfiles] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")
  const [saving, setSaving] = useState(false)

  const stepIndex = mailboxOnboardingSteps.findIndex((item) => item.key === step)
  const current = mailboxOnboardingSteps[stepIndex]

  async function loadProfiles() {
    const result = await api("/api/email-os/provider-profiles")
    setProfiles(result.data || [])
    if (!setup.providerProfileId && result.data?.[0]?.id) {
      setSetup((prev: any) => ({ ...prev, providerProfileId: result.data[0].id }))
    }
  }

  async function createMenaraProfile() {
    const result = await api("/api/email-os/provider-profiles", {
      method: "POST",
      body: JSON.stringify({ useMenaraDefault: true })
    })
    setStatus(result.ok ? "Menara provider profile created" : result.error || "Failed")
    await loadProfiles()
  }

  async function testProvider() {
    const result = await api("/api/email-os/provider-profiles/test", {
      method: "POST",
      body: JSON.stringify({
        providerProfileId: setup.providerProfileId,
        username: setup.username || setup.emailAddress,
        password: setup.passwordRef
      })
    })
    setStatus(result.ok ? "Provider test completed" : result.error || "Provider test failed")
  }

  async function saveMailbox() {
    setSaving(true)
    setStatus("Creating mailbox...")
    const result = await api("/api/email-os/mailbox-onboarding", {
      method: "POST",
      body: JSON.stringify({
        name: setup.name,
        emailAddress: setup.emailAddress,
        username: setup.username || setup.emailAddress,
        passwordRef: setup.passwordRef,
        providerProfileId: setup.providerProfileId,
        owner: setup.owner
      })
    })
    setSaving(false)
    setStatus(result.ok ? "Mailbox onboarded successfully" : result.error || "Mailbox onboarding failed")
  }

  useEffect(() => { loadProfiles() }, [])

  const completion = useMemo(() => {
    const required = [setup.name, setup.emailAddress, setup.providerProfileId, setup.passwordRef, setup.owner]
    return Math.round((required.filter(Boolean).length / required.length) * 100)
  }, [setup])

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Premium Mailbox Onboarding</h1>
              <p className="mt-1 text-sm text-slate-500">{status}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">{completion}% complete</div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {mailboxOnboardingSteps.map((item) => {
              const Icon = icons[item.key]
              const active = item.key === step
              return (
                <button
                  key={item.key}
                  onClick={() => setStep(item.key)}
                  className={active ? "cursor-pointer rounded-2xl border border-slate-950 bg-slate-950 p-4 text-left text-white" : "cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-white"}
                >
                  <Icon className="h-5 w-5" />
                  <div className="mt-3 text-sm font-black">{item.label}</div>
                  <div className={active ? "mt-1 text-xs font-semibold text-slate-300" : "mt-1 text-xs font-semibold text-slate-500"}>{item.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            {(() => {
              const Icon = icons[step]
              return <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><Icon className="h-5 w-5" /></div>
            })()}
            <div>
              <h2 className="text-xl font-black text-slate-950">{current.label}</h2>
              <p className="text-sm text-slate-500">{current.description}</p>
            </div>
          </div>

          {step === "identity" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PremiumField label="Mailbox display name" helper="Example: Support Inbox">
                <PremiumInput value={setup.name} onChange={(e) => setSetup({ ...setup, name: e.target.value })} placeholder="Support Inbox" />
              </PremiumField>
              <PremiumField label="Email address" helper="Real mailbox address">
                <PremiumInput value={setup.emailAddress} onChange={(e) => setSetup({ ...setup, emailAddress: e.target.value, username: setup.username || e.target.value })} placeholder="supports@angelcare.ma" />
              </PremiumField>
              <PremiumField label="Owner team">
                <PremiumInput value={setup.owner} onChange={(e) => setSetup({ ...setup, owner: e.target.value })} placeholder="operations" />
              </PremiumField>
              <PremiumField label="Department">
                <PremiumInput value={setup.department} onChange={(e) => setSetup({ ...setup, department: e.target.value })} placeholder="Operations" />
              </PremiumField>
            </div>
          ) : null}

          {step === "provider" ? (
            <div className="space-y-4">
              <PremiumField label="Provider profile" helper="SMTP + IMAP configuration">
                <PremiumSelect value={setup.providerProfileId} onChange={(e) => setSetup({ ...setup, providerProfileId: e.target.value })}>
                  <option value="">Select provider profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name} • {profile.smtp_host}:{profile.smtp_port}</option>
                  ))}
                </PremiumSelect>
              </PremiumField>
              <div className="flex flex-wrap gap-2">
                <button onClick={createMenaraProfile} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">
                  <Server className="h-4 w-4" /> Create Menara default
                </button>
                <button onClick={loadProfiles} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">
                  <RefreshCw className="h-4 w-4" /> Refresh profiles
                </button>
              </div>
            </div>
          ) : null}

          {step === "credentials" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PremiumField label="Username" helper="Usually same as email">
                  <PremiumInput value={setup.username} onChange={(e) => setSetup({ ...setup, username: e.target.value })} placeholder="supports@angelcare.ma" />
                </PremiumField>
                <PremiumField label="Password / password reference" helper="Temporary validation value">
                  <PremiumInput type="password" value={setup.passwordRef} onChange={(e) => setSetup({ ...setup, passwordRef: e.target.value })} placeholder="Mailbox password" />
                </PremiumField>
              </div>
              <button onClick={testProvider} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
                <Network className="h-4 w-4" /> Test SMTP + IMAP
              </button>
            </div>
          ) : null}

          {step === "routing" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PremiumField label="Inbound routing">
                <PremiumSelect value={setup.inboundRouting} onChange={(e) => setSetup({ ...setup, inboundRouting: e.target.value })}>
                  <option value="operations">Operations</option>
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                  <option value="executive">Executive Review</option>
                </PremiumSelect>
              </PremiumField>
              <PremiumField label="Outbound routing">
                <PremiumSelect value={setup.outboundRouting} onChange={(e) => setSetup({ ...setup, outboundRouting: e.target.value })}>
                  <option value="standard">Standard</option>
                  <option value="approval_required">Approval required</option>
                  <option value="executive_review">Executive review</option>
                </PremiumSelect>
              </PremiumField>
            </div>
          ) : null}

          {step === "sync" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PremiumField label="Sync frequency minutes">
                <PremiumInput type="number" value={setup.syncFrequencyMinutes} onChange={(e) => setSetup({ ...setup, syncFrequencyMinutes: Number(e.target.value) })} />
              </PremiumField>
              <PremiumField label="Status">
                <PremiumSelect value={setup.status} onChange={(e) => setSetup({ ...setup, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="review">Review</option>
                </PremiumSelect>
              </PremiumField>
            </div>
          ) : null}

          {step === "ai" ? (
            <div className="space-y-3">
              <PremiumToggle checked={setup.enableAiTriage} onChange={(v) => setSetup({ ...setup, enableAiTriage: v })} label="Enable AI triage" description="Categorize, summarize, and prioritize inbound threads." />
              <PremiumToggle checked={setup.enableAiDrafts} onChange={(v) => setSetup({ ...setup, enableAiDrafts: v })} label="Enable AI draft suggestions" description="Prepare replies for human approval." />
              <PremiumToggle checked={setup.requireApprovalForHighRisk} onChange={(v) => setSetup({ ...setup, requireApprovalForHighRisk: v })} label="Require approval for high-risk AI actions" description="Prevents autonomous sensitive responses." />
            </div>
          ) : null}

          {step === "security" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PremiumField label="Permission scope">
                <PremiumSelect value={setup.permissionScope} onChange={(e) => setSetup({ ...setup, permissionScope: e.target.value })}>
                  <option value="operations">Operations</option>
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                  <option value="executive">Executive</option>
                </PremiumSelect>
              </PremiumField>
              <PremiumField label="Vault provider">
                <PremiumSelect value={setup.vaultProvider} onChange={(e) => setSetup({ ...setup, vaultProvider: e.target.value })}>
                  <option value="manual">Manual reference</option>
                  <option value="supabase">Supabase secret</option>
                  <option value="external">External vault</option>
                </PremiumSelect>
              </PremiumField>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-950">Final mailbox setup</h3>
                <pre className="mt-4 max-h-[320px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{JSON.stringify(setup, null, 2)}</pre>
              </div>
              <button disabled={saving} onClick={saveMailbox} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Create production mailbox"}
              </button>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button disabled={stepIndex === 0} onClick={() => setStep(mailboxOnboardingSteps[Math.max(0, stepIndex - 1)].key)} className="h-10 cursor-pointer rounded-xl border border-slate-200 px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40">
              Back
            </button>
            <button disabled={stepIndex === mailboxOnboardingSteps.length - 1} onClick={() => setStep(mailboxOnboardingSteps[Math.min(mailboxOnboardingSteps.length - 1, stepIndex + 1)].key)} className="h-10 cursor-pointer rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <MailboxReadinessCard setup={setup} />
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-black text-slate-950">Production UX Notes</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>This wizard replaces raw scaffold fields with a guided mailbox setup workflow.</p>
            <p>Use this for real onboarding. Keep the old generic drawer only as fallback CRUD.</p>
          </div>
        </section>
      </div>
    </section>
  )
}
