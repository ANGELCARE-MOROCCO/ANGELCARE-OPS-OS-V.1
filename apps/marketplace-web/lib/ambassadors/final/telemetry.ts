export function buildTelemetryEvent(event: {
  eventName: string;
  module: string;
  status: 'ok' | 'warning' | 'error';
  durationMs?: number;
  metadata?: Record<string, unknown>;
}) {
  return {
    event_name: event.eventName,
    module: event.module,
    status: event.status,
    duration_ms: event.durationMs ?? null,
    metadata: event.metadata ?? {}
  };
}
