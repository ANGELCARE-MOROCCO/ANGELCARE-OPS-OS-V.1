"use client";

import { useState } from "react";
import type { ActionState } from "./types";

const initialState = (): ActionState => ({ phase: "idle", message: "" });

export function useAction() {
  const [state, setState] = useState<ActionState>(initialState());

  async function execute<T>(task: () => Promise<T>, successMessage: string): Promise<T | null> {
    setState({ phase: "submitting", message: "Saving controlled action…" });
    try {
      const data = await task();
      setState({ phase: "success", message: successMessage, data });
      return data;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The action could not be completed.";
      setState({ phase: message.includes("APPROVAL") ? "approval-required" : "error", message });
      return null;
    }
  }

  function validate(message: string) { setState({ phase: "validating", message }); }
  function disabled(message: string) { setState({ phase: "disabled", message }); }
  function reset() { setState(initialState()); }

  return { state, execute, validate, disabled, reset };
}
