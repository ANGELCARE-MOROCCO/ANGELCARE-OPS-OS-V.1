"use client";

import { useRef, useState } from "react";
import { createCapitalCommandId, emitCapitalCommandEvent, persistCapitalCommandEvent, type CapitalCommandStatus } from "./action-center";
import type { ActionState } from "./types";

const initialState = (): ActionState => ({ phase: "idle", message: "" });

export type CapitalActionOptions = {
  title?: string;
  workspaceKey?: string;
  stage?: string;
  actionHref?: string;
  auditRef?: string;
};

function currentRoute() {
  return typeof window === "undefined" ? "/ac-capital-os" : window.location.pathname;
}

function workspaceFromRoute(route: string) {
  const part = route.split("/").filter(Boolean)[1];
  return part || "command-floor";
}

function classifyFailure(message: string): { phase: ActionState["phase"]; status: CapitalCommandStatus; stage: string } {
  if (/approval|required.*founder|human review/i.test(message)) return { phase: "approval-required", status: "awaiting-approval", stage: "human-approval" };
  if (/block|disabled|policy|quota|credential|required configuration/i.test(message)) return { phase: "error", status: "blocked", stage: "policy-or-configuration" };
  return { phase: "error", status: "failed", stage: "execution" };
}

function affectedRecordsFrom(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const data = row.data && typeof row.data === "object" ? row.data as Record<string, unknown> : row;
  for (const key of ["affectedRecords", "affected_records", "count", "createdCount", "updatedCount"]) {
    if (data[key] != null && Number.isFinite(Number(data[key]))) return Number(data[key]);
  }
  return null;
}

function detailPreview(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const data = row.data && typeof row.data === "object" ? row.data as Record<string, unknown> : row;
  const preview: Record<string, unknown> = {};
  for (const key of ["warning", "code", "requestId", "decision", "provider", "model", "summary", "status"]) {
    if (data[key] != null) preview[key] = data[key];
  }
  return Object.keys(preview).length ? preview : null;
}

export function useAction() {
  const [state, setState] = useState<ActionState>(initialState());
  const activeId = useRef<string | null>(null);

  async function execute<T>(task: () => Promise<T>, successMessage: string, options: CapitalActionOptions = {}): Promise<T | null> {
    if (state.phase === "submitting") return null;
    const id = createCapitalCommandId();
    activeId.current = id;
    const route = currentRoute();
    const workspaceKey = options.workspaceKey || workspaceFromRoute(route);
    const startedAt = new Date().toISOString();
    const title = options.title || "Controlled capital command";
    const runningEvent = {
      id,
      title,
      message: "Command accepted. Validation and controlled execution are in progress.",
      status: "running" as const,
      workspaceKey,
      route,
      stage: options.stage || "validation",
      startedAt,
      completedAt: null,
      actionHref: options.actionHref || route,
      auditRef: options.auditRef || `AC-CMD-${id.slice(0, 8).toUpperCase()}`,
      affectedRecords: null,
      detail: null,
      read: true,
    };
    emitCapitalCommandEvent(runningEvent);
    void persistCapitalCommandEvent(runningEvent);
    setState({ phase: "submitting", message: "Command accepted — validating, executing and recording evidence…" });

    try {
      const data = await task();
      const completedAt = new Date().toISOString();
      const warning = data && typeof data === "object" ? String((data as Record<string, unknown>).warning || "") : "";
      const status: CapitalCommandStatus = warning ? "completed-with-warnings" : "completed";
      const completedEvent = {
        ...runningEvent,
        message: warning ? `${successMessage} ${warning}` : successMessage,
        status,
        stage: warning ? "completed-with-warnings" : "completed",
        completedAt,
        affectedRecords: affectedRecordsFrom(data),
        detail: detailPreview(data),
        read: false,
      };
      emitCapitalCommandEvent(completedEvent);
      void persistCapitalCommandEvent(completedEvent);
      setState({ phase: "success", message: successMessage, data });
      return data;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The action could not be completed.";
      const classification = classifyFailure(message);
      const failedEvent = {
        ...runningEvent,
        title: classification.status === "awaiting-approval" ? "Human approval required" : classification.status === "blocked" ? "Command blocked safely" : "Command failed",
        message,
        status: classification.status,
        stage: classification.stage,
        completedAt: new Date().toISOString(),
        detail: { error: message },
        read: false,
      };
      emitCapitalCommandEvent(failedEvent);
      void persistCapitalCommandEvent(failedEvent);
      setState({ phase: classification.phase, message });
      return null;
    } finally {
      if (activeId.current === id) activeId.current = null;
    }
  }

  function validate(message: string) { setState({ phase: "validating", message }); }
  function disabled(message: string) { setState({ phase: "disabled", message }); }
  function reset() { setState(initialState()); }

  return { state, execute, validate, disabled, reset };
}
