"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  blankPersonal,
  parsePersonal,
  cleanKeys,
  LIMITS,
  moveKey,
  type Personal,
  type Activity,
} from "./contract";
const KEY = "kidflix.personal.v3",
  LEGACY = "kidflix.discovery.v1";
type Store = {
  data: Personal;
  ready: boolean;
  error: boolean;
  change: (fn: (p: Personal) => Personal) => void;
  clear: () => Promise<void>;
  toggle: (key: string) => void;
  visit: (key: string) => void;
  enqueue: (key: string) => void;
  move: (key: string, n: number) => void;
  record: (v: Activity) => void;
};
const Context = createContext<Store>({
  data: blankPersonal(),
  ready: false,
  error: false,
  change: () => {},
  clear: async () => {},
  toggle: () => {},
  visit: () => {},
  enqueue: () => {},
  move: () => {},
  record: () => {},
});
export function PersonalProvider({ children }: { children: ReactNode }) {
  const [data, set] = useState(blankPersonal),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    latest = useRef(data),
    initialized = useRef(false);
  latest.current = data;
  function initialize() {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const stored = localStorage.getItem(KEY),
        legacy = localStorage.getItem(LEGACY);
      const value = parsePersonal(JSON.parse(stored || legacy || "null"));
      latest.current = value;
      set(value);
      if (!stored && legacy) localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      setError(true);
    }
  }
  function change(fn: (p: Personal) => Personal) {
    initialize();
    const next = parsePersonal({
      ...fn(latest.current),
      updatedAt: Date.now(),
    });
    latest.current = next;
    set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setError(false);
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    initialize();
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null)
        try {
          const next = parsePersonal(JSON.parse(e.newValue || "null"));
          latest.current = next;
          set(next);
        } catch {
          setError(true);
        }
    };
    const progress = (e: Event) => {
      const a = (e as CustomEvent<Activity>).detail;
      if (a?.key)
        change((p) => ({
          ...p,
          activity: [
            a,
            ...p.activity.filter((v) => v.id !== a.id || v.locale !== a.locale),
          ].slice(0, 500),
        }));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("kidflix:progress", progress);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("kidflix:progress", progress);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.kidflixMotion = data.preferences.motion
      ? "yes"
      : "no";
    document.documentElement.dataset.kidflixLowData = data.preferences.lowData
      ? "yes"
      : "no";
  }, [data.preferences.motion, data.preferences.lowData]);
  async function clear() {
    let failed = false;
    for (const name of ["localStorage", "sessionStorage"] as const) {
      try {
        const storage = window[name];
        for (let i = storage.length - 1; i >= 0; i--) {
          const k = storage.key(i);
          if (k?.startsWith("kidflix.")) storage.removeItem(k);
        }
      } catch {
        failed = true;
      }
    }
    try {
      if ("caches" in window)
        for (const k of await caches.keys())
          if (k.startsWith("kidflix-offline-")) await caches.delete(k);
    } catch {
      failed = true;
    }
    latest.current = blankPersonal();
    set(latest.current);
    setError(failed);
    window.dispatchEvent(new Event("kidflix:cleared"));
    if (failed) throw Error("STORAGE_UNAVAILABLE");
  }
  return (
    <Context.Provider
      value={{
        data,
        ready,
        error,
        change,
        clear,
        toggle: (key) =>
          change((p) => ({
            ...p,
            saved: p.saved.some((x) => x.key === key)
              ? p.saved.filter((x) => x.key !== key)
              : [{ key, at: Date.now() }, ...p.saved].slice(0, LIMITS.saved),
          })),
        visit: (key) =>
          change((p) => ({
            ...p,
            recent: [
              { key, at: Date.now() },
              ...p.recent.filter((x) => x.key !== key),
            ].slice(0, LIMITS.recent),
          })),
        enqueue: (key) =>
          change((p) => ({
            ...p,
            queue: p.queue.includes(key)
              ? p.queue.filter((x) => x !== key)
              : cleanKeys([...p.queue, key]),
          })),
        move: (key, n) =>
          change((p) => ({ ...p, queue: moveKey(p.queue, key, n) })),
        record: (a) =>
          change((p) => ({
            ...p,
            activity: [
              a,
              ...p.activity.filter(
                (v) => v.id !== a.id || v.locale !== a.locale,
              ),
            ].slice(0, 500),
          })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePersonal = () => useContext(Context);
