export function logContentCommandRuntimeEvent(event: {
  level: 'info' | 'warn' | 'error';
  area: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  const body = {
    ...event,
    at: new Date().toISOString(),
  };

  if (event.level === 'error') console.error('[ContentCommand]', body);
  else if (event.level === 'warn') console.warn('[ContentCommand]', body);
  else console.info('[ContentCommand]', body);
}