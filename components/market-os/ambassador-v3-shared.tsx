"use client"

import * as React from "react"
import Link from "next/link"

export type AmbassadorRecord = {
  id: string
  name: string
  phone: string
  email: string
  city: string
  territory: string
  program: string
  tier: string
  status: string
  commission: string
  source: string
  notes: string
  createdAt: string
}

export type MissionRecord = {
  id: string
  title: string
  ambassadorId: string
  missionType: string
  dueDate: string
  reward: string
  proofRequired: string
  status: string
  instructions: string
  createdAt: string
}

export type ProgramRecord = {
  id: string
  name: string
  tier: string
  commission: string
  eligibility: string
  regions: string
  training: string
  bonusRules: string
  status: string
  createdAt: string
}

export type RewardRecord = {
  id: string
  ambassadorId: string
  amount: string
  reason: string
  payoutDate: string
  status: string
  createdAt: string
}

export const AMBASSADOR_STORAGE_KEY = "angelcare.marketos.ambassadors.v3.records"
export const MISSION_STORAGE_KEY = "angelcare.marketos.ambassadors.v3.missions"
export const PROGRAM_STORAGE_KEY = "angelcare.marketos.ambassadors.v3.programs"
export const REWARD_STORAGE_KEY = "angelcare.marketos.ambassadors.v3.rewards"

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const starterAmbassadors: AmbassadorRecord[] = []
export const starterMissions: MissionRecord[] = []
export const starterPrograms: ProgramRecord[] = []
export const starterRewards: RewardRecord[] = []

export const statusOptions = ["draft", "candidate", "onboarding", "active", "paused", "watchlist", "archived"]
export const tierOptions = ["starter", "silver", "gold", "strategic", "clinic-partner", "creator"]
export const programOptions = ["Mothers Circle", "Clinic Referral", "Academy Advocate", "Home Care Creator", "City Expansion"]
export const territoryOptions = ["Rabat-Sale-Kenitra", "Grand Casablanca", "Marrakech-Safi", "Tanger-Tetouan", "Fes-Meknes", "National"]

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-900"><span>{label}</span>{children}</label>
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" />
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900" />
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:bg-white disabled:opacity-40" />
}

export function SoftButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-40" />
}

export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:bg-rose-700 disabled:opacity-40" />
}

export function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><h2 className="text-xl font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-sm text-slate-9500">{subtitle}</p> : null}</div>{children}</section>
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-widest text-slate-9500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p>{hint ? <p className="mt-1 text-xs font-semibold text-slate-9500">{hint}</p> : null}</div>
}

export function PageShell({ title, subtitle, children, actions }: { title: string; subtitle: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return <main data-market-os-root className="min-h-screen bg-slate-50 p-6 text-slate-950"><header className="rounded-[34px] bg-white p-8 text-slate-950 shadow-xl"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Market-OS · Ambassador Program</p><h1 className="mt-3 text-4xl font-black tracking-tight">{title}</h1><p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-slate-700">{subtitle}</p></div><div className="flex flex-wrap gap-3">{actions}<Link href="/market-os/ambassadors" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-50">Back to workspace</Link></div></div></header><div className="mt-6">{children}</div></main>
}
