"use client";

import { useEffect } from "react";
import { holdRouteLoading } from "./navigation-loading";

/** The persistent shell owns the one floating toast; this boundary adds no page UI. */
export function RouteLoading() {
  useEffect(holdRouteLoading, []);
  return null;
}
