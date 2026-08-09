import type { Phase27ActivationStatus, Phase27RouteConfig, Phase27RouteKey } from './phase27-routing-types';

export function getPhase27OrderedRoutes(routes: Phase27RouteConfig[]): Phase27RouteConfig[] {
  return routes.filter((route) => route.enabled).sort((a, b) => a.order - b.order);
}

export function getPhase27RouteByKey(routes: Phase27RouteConfig[], key: Phase27RouteKey): Phase27RouteConfig | undefined {
  return routes.find((route) => route.key === key);
}

export function getPhase27BuildSafePercent(statuses: Phase27ActivationStatus[]): number {
  if (statuses.length === 0) return 0;
  const safe = statuses.filter((status) => status.buildSafe).length;
  return Math.round((safe / statuses.length) * 100);
}

export function getPhase27MountedCount(statuses: Phase27ActivationStatus[]): number {
  return statuses.filter((status) => status.mounted).length;
}