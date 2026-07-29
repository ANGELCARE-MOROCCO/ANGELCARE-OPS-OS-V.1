"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function useActionQuery<T extends string>(mapping: Record<string, T>, open: (value: T) => void) {
  const searchParams = useSearchParams();
  const consumed = useRef("");
  useEffect(() => {
    const action = searchParams.get("action") || "";
    if (!action || consumed.current === action) return;
    const mapped = mapping[action];
    if (mapped) { consumed.current = action; open(mapped); }
  }, [mapping, open, searchParams]);
}
