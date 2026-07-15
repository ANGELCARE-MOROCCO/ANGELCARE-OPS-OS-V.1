"use client";

export type FactoryCommandPayload = {
  command: string;
  page?: string;
  module_key?: string;
  [key: string]: unknown;
};

export async function runSaasFactoryCommand(payload: FactoryCommandPayload) {
  const response = await fetch("/api/saas-factory/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `SaaS Factory command failed: ${response.status}`);
  }

  return data;
}

export async function getSaasFactoryOptions(group: string) {
  const response = await fetch(`/api/saas-factory/options?group=${encodeURIComponent(group)}`, {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "Failed to load live options");
  }
  return data;
}

export async function saveLiveOption(input: {
  group_key: string;
  label: string;
  value?: string;
  modules?: string[];
  metadata_json?: Record<string, unknown>;
}) {
  return runSaasFactoryCommand({
    command: "option.upsert",
    ...input,
  });
}

export async function publishFactoryChanges(scope = "all") {
  return runSaasFactoryCommand({
    command: "publish.changes",
    scope,
  });
}

export async function controlFactoryModule(module_key: string, action: string) {
  return runSaasFactoryCommand({
    command: "module.control",
    module_key,
    action,
  });
}

export async function createFactoryIncident(title: string, severity = "warning") {
  return runSaasFactoryCommand({
    command: "incident.create",
    title,
    severity,
  });
}
