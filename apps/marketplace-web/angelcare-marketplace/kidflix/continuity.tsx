"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
const KEY = "kidflix.discovery.v1",
  TTL = 90 * 24 * 60 * 60 * 1000;
type Entry = { key: string; at: number };
type Store = { version: 1; saved: Entry[]; recent: Entry[] };
const blank = (): Store => ({ version: 1, saved: [], recent: [] });
export function parseStore(raw: string | null, now = Date.now()): Store {
  try {
    const x = JSON.parse(raw || "null");
    if (x?.version !== 1) return blank();
    const list = (v: unknown, max: number): Entry[] =>
      Array.isArray(v)
        ? [
            ...new Map(
              v
                .filter(
                  (a) =>
                    a &&
                    typeof a.key === "string" &&
                    /^[a-z0-9][a-z0-9._-]{1,119}$/.test(a.key) &&
                    Number.isFinite(a.at) &&
                    a.at <= now &&
                    now - a.at < TTL,
                )
                .map((a) => [a.key, { key: a.key, at: a.at }]),
            ).values(),
          ].slice(0, max)
        : [];
    return {
      version: 1,
      saved: list(x.saved, 100),
      recent: list(x.recent, 20),
    };
  } catch {
    return blank();
  }
}
const Guest = createContext({
  saved: [] as string[],
  recent: [] as string[],
  ready: false,
  toggle: (_key: string) => {},
  visit: (_key: string) => {},
  clear: () => {},
});
export function GuestProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState<Store>(blank),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      set(parseStore(localStorage.getItem(KEY)));
    } catch {}
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) set(parseStore(e.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {}
  }, [state, ready]);
  return (
    <Guest.Provider
      value={{
        saved: state.saved.map((e) => e.key),
        recent: state.recent.map((e) => e.key),
        ready,
        toggle: (key) =>
          set((s) => ({
            ...s,
            saved: s.saved.some((e) => e.key === key)
              ? s.saved.filter((e) => e.key !== key)
              : [{ key, at: Date.now() }, ...s.saved].slice(0, 100),
          })),
        visit: (key) =>
          set((s) => ({
            ...s,
            recent: [
              { key, at: Date.now() },
              ...s.recent.filter((e) => e.key !== key),
            ].slice(0, 20),
          })),
        clear: () => {
          set(blank());
          try {
            localStorage.removeItem(KEY);
          } catch {}
        },
      }}
    >
      {children}
    </Guest.Provider>
  );
}
export const useGuest = () => useContext(Guest);
