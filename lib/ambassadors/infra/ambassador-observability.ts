export type TelemetryEvent = {
  name: string;
  module: string;
  durationMs?: number;
  status: 'ok' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
};

export function createTelemetryEvent(event: TelemetryEvent): TelemetryEvent & { timestamp: string } {
  return {
    ...event,
    metadata: event.metadata ?? {},
    timestamp: new Date().toISOString()
  };
}
