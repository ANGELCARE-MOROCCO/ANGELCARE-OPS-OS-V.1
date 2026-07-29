"use client"

import * as React from "react"
import { headquartersAction, useHeadquartersSnapshot } from "../headquarters/client"
import { buildProofCases, normalizeSnapshot } from "./bulk5-model"

export function useBulk5ProofRegistry() {
  const source = useHeadquartersSnapshot()
  const normalized = React.useMemo(() => normalizeSnapshot(source.snapshot), [source.snapshot])
  const cases = React.useMemo(() => buildProofCases(normalized), [normalized])

  const analyzeEvidence = React.useCallback(async (evidenceId: string) => {
    await headquartersAction("analyze_evidence", { evidenceId })
    await source.refresh()
  }, [source])

  const recordHumanReview = React.useCallback(async (input: {
    dossierId: string
    evidenceId?: string
    result: "approved" | "revision" | "blocked"
    summary: string
    corrections?: string[]
    authorityRole: string
    score?: number
  }) => {
    await headquartersAction("record_human_review", {
      dossierId: input.dossierId,
      evidenceId: input.evidenceId || "",
      result: input.result,
      score: input.score ?? (input.result === "approved" ? 100 : input.result === "revision" ? 55 : 20),
      summary: input.summary,
      corrections: (input.corrections || []).filter(Boolean).map((instruction, index) => ({ code: `COR-${index + 1}`, instruction })),
      authorityRole: input.authorityRole,
    })
    await source.refresh()
  }, [source])

  const uploadEvidence = React.useCallback(async (input: { dossierId: string; file: File; title: string; note: string; progress: number }) => {
    const body = new FormData()
    body.set("dossierId", input.dossierId)
    body.set("title", input.title)
    body.set("note", input.note)
    body.set("progressPercent", String(input.progress))
    body.set("file", input.file)
    const response = await fetch("/api/market-os/content-command-headquarters/source-upload?mode=evidence", { method: "POST", body, credentials: "include" })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "EVIDENCE_UPLOAD_FAILED")
    await source.refresh()
    return payload
  }, [source])

  return { ...source, snapshot: normalized, cases, analyzeEvidence, recordHumanReview, uploadEvidence }
}
