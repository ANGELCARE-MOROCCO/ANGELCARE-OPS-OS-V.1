"use client"

import * as React from "react"
import { Bulk7ImpactObservatory } from "./experience-bulk7/Bulk7ImpactWorkspaces"

/**
 * Legacy compatibility mount.
 *
 * Phase 18 previously rendered hard-coded performance, attribution and ROI
 * samples. Bulk 7 retires that unsafe surface and routes every legacy mount to
 * the persisted, provenance-aware Impact Observatory.
 */
export function ContentCommandPhase18AnalyticsWorkspace(): React.ReactElement {
  return <Bulk7ImpactObservatory />
}

export default ContentCommandPhase18AnalyticsWorkspace
