"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getWhatsAppDesktopApi } from "@/lib/desktop-runtime"
import type { WhatsAppBusinessContext, WhatsAppContextType, WhatsAppOutcomeStatus, WhatsAppPhoneNormalization } from "@/lib/whatsapp-desktop/context-types"
import { useWhatsAppGovernance } from "@/components/whatsapp-os/useWhatsAppGovernance"

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: string }
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
  return payload.data as T
}

export function useWhatsAppBusinessContext() {
  const search = useSearchParams()
  const governance = useWhatsAppGovernance()
  const [context, setContext] = useState<WhatsAppBusinessContext | null>(null)
  const [phone, setPhone] = useState<WhatsAppPhoneNormalization | null>(null)
  const [message, setMessage] = useState("")
  const [attempt, setAttempt] = useState<Record<string, any> | null>(null)
  const [snippets, setSnippets] = useState<Record<string, any>[]>([])
  const [templates, setTemplates] = useState<Record<string, any>[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resolvedKey = useRef("")

  const contextType = search.get("contextType") as WhatsAppContextType | null
  const entityId = search.get("entityId")
  const purpose = search.get("purpose") || undefined
  const sourceRoute = search.get("sourceRoute") || undefined
  const selectedWorkspaceId = governance.status?.selectedWorkspaceId || governance.selectedWorkspace?.id || null
  const deviceId = governance.status?.deviceId || null

  const refresh = useCallback(async (id = context?.id) => {
    if (!id) return null
    const value = await api<WhatsAppBusinessContext>(`/api/whatsapp-desktop/context/${id}`)
    setContext(value); setMessage(value.prepared_message || "")
    const latest = (value.attempts || [])[0] as Record<string, any> | undefined
    if (latest) setAttempt(latest)
    return value
  }, [context?.id])

  const resolveContext = useCallback(async (input: { context_type: WhatsAppContextType; entity_id: string; purpose?: string; source_route?: string; entity_hint?: Record<string, unknown>; prepared_message?: string }) => {
    if (!selectedWorkspaceId) throw new Error("WORKSPACE_NOT_SELECTED")
    setBusy("resolve"); setError(null)
    try {
      const result = await api<{ context: WhatsAppBusinessContext; phone: WhatsAppPhoneNormalization }>("/api/whatsapp-desktop/context/resolve", {
        method: "POST", body: JSON.stringify({ ...input, workspace_id: selectedWorkspaceId, device_id: deviceId }),
      })
      setContext(result.context); setPhone(result.phone); setMessage(result.context.prepared_message || ""); setAttempt(null)
      return result.context
    } catch (cause) { const text = cause instanceof Error ? cause.message : String(cause); setError(text); throw cause }
    finally { setBusy(null) }
  }, [deviceId, selectedWorkspaceId])

  useEffect(() => {
    if (!governance.status?.authorized || !selectedWorkspaceId || !contextType || !entityId) return
    const key = `${selectedWorkspaceId}:${contextType}:${entityId}:${purpose || ""}`
    if (resolvedKey.current === key) return
    resolvedKey.current = key
    void resolveContext({ context_type: contextType, entity_id: entityId, purpose, source_route: sourceRoute }).catch(() => { resolvedKey.current = "" })
  }, [contextType, entityId, governance.status?.authorized, purpose, resolveContext, selectedWorkspaceId, sourceRoute])

  useEffect(() => {
    if (!governance.status?.authorized) return
    void Promise.all([
      api<Record<string, any>[]>(`/api/whatsapp-desktop/snippets${context?.module_label ? `?module=${encodeURIComponent(context.module_label.toLowerCase())}` : ""}`),
      api<Record<string, any>[]>(`/api/whatsapp-desktop/templates${context?.module_label ? `?module=${encodeURIComponent(context.module_label.toLowerCase())}` : ""}`),
    ]).then(([nextSnippets, nextTemplates]) => { setSnippets(nextSnippets); setTemplates(nextTemplates) }).catch(() => undefined)
  }, [context?.module_label, governance.status?.authorized])

  const createManualContext = useCallback(async (input: { name: string; phone: string; purpose: string; message?: string }) => resolveContext({
    context_type: "custom", entity_id: crypto.randomUUID(), purpose: input.purpose,
    entity_hint: { entity_name: input.name, phone_number: input.phone, module_label: "Contact libre", source_route: "/whatsapp-os/web-session", prepared_message: input.message || "" },
    prepared_message: input.message,
  }), [resolveContext])

  const saveMessage = useCallback(async (body = message) => {
    if (!context) throw new Error("CONTEXT_REQUIRED")
    setBusy("message"); setError(null)
    try {
      const value = await api<Record<string, any>>("/api/whatsapp-desktop/prepared-messages", { method: "POST", body: JSON.stringify({ context_id: context.id, body, message_mode: "corporate", language: context.preferred_language || "fr", source_type: "manual" }) })
      setMessage(body); setContext((current) => current ? { ...current, prepared_message: body } : current)
      return value
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); throw cause } finally { setBusy(null) }
  }, [context, message])

  const openConversation = useCallback(async () => {
    if (!context) throw new Error("CONTEXT_REQUIRED")
    const desktop = getWhatsAppDesktopApi(); if (!desktop) throw new Error("ANGELCARE_DESKTOP_REQUIRED")
    setBusy("open"); setError(null)
    try {
      if (message !== (context.prepared_message || "")) await saveMessage(message)
      const result = await api<{ attempt: Record<string, any>; navigation: { phone: string; text: string; contextId: string; attemptId: string } }>("/api/whatsapp-desktop/context/open", { method: "POST", body: JSON.stringify({ context_id: context.id, device_id: deviceId, prepared_message: message }) })
      await desktop.navigate(result.navigation)
      setAttempt(result.attempt); await refresh(context.id)
      return result
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); throw cause } finally { setBusy(null) }
  }, [context, deviceId, message, refresh, saveMessage])

  const recordOutcome = useCallback(async (input: { outcome_status: WhatsAppOutcomeStatus; outcome_note?: string; next_action_at?: string; business_stage_update?: string; declared_sent?: boolean; evidence_reference?: string }) => {
    if (!attempt?.id) throw new Error("CONTACT_ATTEMPT_REQUIRED")
    setBusy("outcome"); setError(null)
    try { const value = await api<Record<string, any>>(`/api/whatsapp-desktop/contact-attempts/${attempt.id}/outcome`, { method: "PATCH", body: JSON.stringify(input) }); setAttempt(value); await refresh(); return value }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); throw cause } finally { setBusy(null) }
  }, [attempt?.id, refresh])

  const action = useCallback(async (kind: "notes"|"tasks"|"appointments"|"handoff"|"escalate", payload: Record<string, unknown>) => {
    if (!context) throw new Error("CONTEXT_REQUIRED")
    setBusy(kind); setError(null)
    try { const value = await api<Record<string, any>>(`/api/whatsapp-desktop/context/${context.id}/${kind}`, { method: "POST", body: JSON.stringify(payload) }); await refresh(context.id); return value }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); throw cause } finally { setBusy(null) }
  }, [context, refresh])

  const appendSnippet = useCallback((body: string) => setMessage((current) => `${current}${current.trim() ? "\n\n" : ""}${body}`), [])
  const applyTemplate = useCallback((body: string) => setMessage(body), [])

  return useMemo(() => ({
    governance, context, phone, message, setMessage, attempt, snippets, templates, busy, error,
    resolveContext, createManualContext, refresh, saveMessage, openConversation, recordOutcome,
    addNote: (payload: Record<string, unknown>) => action("notes", payload),
    addTask: (payload: Record<string, unknown>) => action("tasks", payload),
    addAppointment: (payload: Record<string, unknown>) => action("appointments", payload),
    handoff: (payload: Record<string, unknown>) => action("handoff", payload),
    escalate: (payload: Record<string, unknown>) => action("escalate", payload),
    appendSnippet, applyTemplate,
  }), [action, appendSnippet, applyTemplate, attempt, busy, context, createManualContext, error, governance, message, openConversation, phone, recordOutcome, refresh, resolveContext, saveMessage, snippets, templates])
}
