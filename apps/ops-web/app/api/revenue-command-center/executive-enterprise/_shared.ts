import { NextResponse } from "next/server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import {
  buildExecutivePortfolio,
  executiveContext,
  executeExecutiveCommand,
} from "@/lib/revenue-command-center/executive-enterprise/server"
import type {
  ExecutiveCommand,
  ExecutiveCommandPayload,
  ExecutiveExperience,
} from "@/components/revenue-command-center/executive-enterprise/types"

export const EXECUTIVE_EXPERIENCES = new Set<ExecutiveExperience>([
  "executive-overview",
  "control-tower",
  "executive-briefing",
  "forecast-command",
  "strategy-room",
  "revenue-analytics",
  "team-intelligence",
  "overdue-heatmap",
  "workload-command",
  "management-decision-room",
])

export function executiveFailure(error: unknown) {
  const access = revenueAccessFailure(error)
  const message = access?.message || (error instanceof Error ? error.message : "Commande exécutive indisponible.")
  return NextResponse.json(
    { ok: false, error: message },
    { status: access?.status || 500 },
  )
}

export function readExperience(request: Request, fallback: ExecutiveExperience): ExecutiveExperience {
  const value = new URL(request.url).searchParams.get("experience") as ExecutiveExperience | null
  return value && EXECUTIVE_EXPERIENCES.has(value) ? value : fallback
}

export async function executivePortfolioResponse(
  request: Request,
  fallback: ExecutiveExperience,
  slice?: keyof Awaited<ReturnType<typeof buildExecutivePortfolio>>,
) {
  try {
    const { supabase } = await executiveContext("revenue.executive.read")
    const portfolio = await buildExecutivePortfolio(supabase, readExperience(request, fallback))
    if (slice) {
      return NextResponse.json({
        ok: true,
        source: "revenue_executive_enterprise",
        syncedAt: portfolio.syncedAt,
        schema: portfolio.schema,
        [slice]: portfolio[slice],
        summary: portfolio.summary,
      })
    }
    return NextResponse.json({ ok: true, source: "revenue_executive_enterprise", portfolio })
  } catch (error) {
    return executiveFailure(error)
  }
}

export async function executiveCommandResponse(
  request: Request,
  allowedCommands?: ExecutiveCommand[],
  forcedCommand?: ExecutiveCommand,
) {
  try {
    const { access, supabase } = await executiveContext("revenue.executive.manage")
    const body = (await request.json()) as ExecutiveCommandPayload
    const command = forcedCommand || body.command
    if (!command) {
      return NextResponse.json({ ok: false, error: "Commande requise." }, { status: 400 })
    }
    if (allowedCommands?.length && !allowedCommands.includes(command)) {
      return NextResponse.json({ ok: false, error: "Commande non autorisée sur ce point d’entrée." }, { status: 400 })
    }
    const result = await executeExecutiveCommand(
      supabase,
      String((access.user as any)?.id || "") || null,
      { ...body, command },
    )
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return executiveFailure(error)
  }
}
