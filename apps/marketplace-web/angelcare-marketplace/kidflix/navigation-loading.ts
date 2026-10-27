/** Browser-only holds from App Router loading boundaries. No SSR request state. */
const holds = new Set<symbol>();
const listeners = new Set<() => void>();

export const serverLoadingCount = () => 0;
export const routeLoadingCount = () => typeof window === "undefined" ? 0 : holds.size;
export function subscribeRouteLoading(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function holdRouteLoading() {
  if (typeof window === "undefined") return () => {};
  const token = Symbol("kidflix-route-loading");
  holds.add(token);
  listeners.forEach((listener) => listener());
  return () => {
    if (holds.delete(token)) listeners.forEach((listener) => listener());
  };
}
