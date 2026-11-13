"use client";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { DiscoveryItem } from "../catalog-discovery/types";
import { projectReducer, restoreProject } from "./model";

/** No contact data is persisted. Storage denial never blocks the journey. */
export function useSessionValue<T>(
  key: string,
  initial: T,
  decode: (value: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const initialRef = useRef(initial),
    decodeRef = useRef(decode);
  useEffect(() => {
    let next = initialRef.current;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw && raw.length <= 24000) next = decodeRef.current(JSON.parse(raw));
    } catch {}
    setValue(next);
    setLoadedKey(key);
  }, [key]);
  useEffect(() => {
    if (loadedKey === key)
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {}
  }, [value, key, loadedKey]);
  return [value, setValue];
}
export function useProject(offers: DiscoveryItem[], territory?: string | null) {
  const [state, dispatch] = useReducer(projectReducer, {
    items: [],
    notice: "",
  });
  const key = `ac.establishments.project.v3:${territory || "default"}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const liveOffers = useRef(offers);
  liveOffers.current = offers;
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(key);
    } catch {}
    dispatch({
      type: "restore",
      items: restoreProject(raw, liveOffers.current),
    });
    setLoadedKey(key);
  }, [key, offers]);
  useEffect(() => {
    if (loadedKey === key)
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify(state.items.map((item) => item.key)),
        );
      } catch {}
  }, [state.items, key, loadedKey]);
  return { project: state.items, notice: state.notice, dispatch };
}
