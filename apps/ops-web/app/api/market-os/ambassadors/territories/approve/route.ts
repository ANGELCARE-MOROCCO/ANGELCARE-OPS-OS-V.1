import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import {
  assignAmbassadorTerritory,
  createAmbassadorEntity,
  getAmbassadorEntity,
  loadAmbassadorWorkspaceSnapshot,
  updateAmbassadorEntity,
} from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

type Row = Record<string, any>

function asRecord(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {}
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Row =>
          Boolean(item) &&
          typeof item === "object" &&
          !Array.isArray(item),
      )
    : []
}

function text(value: unknown): string {
  return String(value ?? "").trim()
}

function parseNotes(raw: unknown): Row {
  const source = text(raw)

  if (!source) {
    return {
      version: 2,
      pendingAssignments: [],
      assignmentHistory: [],
    }
  }

  try {
    const parsed = source.startsWith("AMB_TERRITORY_OS_V2:")
      ? JSON.parse(source.slice("AMB_TERRITORY_OS_V2:".length))
      : JSON.parse(source)

    const record = asRecord(parsed)

    return {
      ...record,
      version: 2,
      pendingAssignments: asRows(record.pendingAssignments),
      assignmentHistory: asRows(record.assignmentHistory),
    }
  } catch {
    return {
      version: 2,
      legacyNote: source,
      pendingAssignments: [],
      assignmentHistory: [],
    }
  }
}

function serializeNotes(config: Row): string {
  return `AMB_TERRITORY_OS_V2:${JSON.stringify({
    ...config,
    version: 2,
    lastUpdatedAt: new Date().toISOString(),
  })}`
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request)

    const territoryId = text(body.territory_id)
    const assignmentId = text(body.assignment_id)
    const ambassadorId = text(body.ambassador_id)
    const decision = text(body.decision)
    const managerName = text(body.manager_name)
    const decisionNote = text(body.decision_note)

    if (!territoryId || !assignmentId || !ambassadorId) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error:
          "territory_id, assignment_id and ambassador_id are required",
      })
    }

    if (!["approved", "rejected"].includes(decision)) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error: "Decision must be approved or rejected",
      })
    }

    if (!managerName) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error: "Manager name is required",
      })
    }

    if (decision === "rejected" && !decisionNote) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error: "A rejection reason is required",
      })
    }

    const territoryResult = await getAmbassadorEntity(
      "territories",
      territoryId,
    )

    if (!territoryResult.ok || !territoryResult.record) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error: territoryResult.error || "Territory not found",
      })
    }

    const ambassadorResult = await getAmbassadorEntity(
      "ambassadors",
      ambassadorId,
    )

    if (!ambassadorResult.ok || !ambassadorResult.record) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error: ambassadorResult.error || "Ambassador not found",
      })
    }

    const ambassadorStatus = text(
      ambassadorResult.record.status ||
        ambassadorResult.record.lifecycle_stage,
    ).toLowerCase()

    if (
      decision === "approved" &&
      ["archived", "suspended", "inactive"].some((status) =>
        ambassadorStatus.includes(status),
      )
    ) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error:
          "Archived, suspended or inactive ambassadors cannot be assigned",
      })
    }

    const config = parseNotes(territoryResult.record.notes)
    const pendingAssignments = asRows(config.pendingAssignments)
    const assignment = pendingAssignments.find(
      (item) =>
        text(item.id) === assignmentId &&
        text(item.ambassadorId) === ambassadorId,
    )

    const assignmentHistory = asRows(config.assignmentHistory)
    const previousDecision = assignmentHistory.find(
      (item) => text(item.id) === assignmentId,
    )

    if (previousDecision) {
      if (text(previousDecision.decision) !== decision) {
        return ambassadorJson({
          ok: false,
          source: "ambassador-territory-approval",
          error:
            "This assignment already has a different final decision",
        })
      }

      const snapshotResult = await loadAmbassadorWorkspaceSnapshot()

      return ambassadorJson({
        ok: true,
        source: "ambassador-territory-approval",
        idempotent: true,
        decision,
        territory: territoryResult.record,
        ambassador: ambassadorResult.record,
        snapshot: snapshotResult.snapshot,
      })
    }

    if (!assignment) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error: "Pending assignment not found",
      })
    }

    let assignedAmbassador = ambassadorResult.record

    if (decision === "approved") {
      const assignmentResult = await assignAmbassadorTerritory({
        ambassador_id: ambassadorId,
        territory_id: territoryId,
        city: body.city || territoryResult.record.city,
        region: body.region || territoryResult.record.region,
      })

      if (!assignmentResult.ok || !assignmentResult.record) {
        return ambassadorJson({
          ok: false,
          source: "ambassador-territory-approval",
          error:
            assignmentResult.error ||
            "The ambassador could not be assigned",
        })
      }

      assignedAmbassador = assignmentResult.record
    }

    const decidedAt = new Date().toISOString()

    const nextConfig = {
      ...config,
      pendingAssignments: pendingAssignments.filter(
        (item) => text(item.id) !== assignmentId,
      ),
      assignmentHistory: [
        {
          id: assignmentId,
          ambassadorId,
          ambassadorName:
            text(assignment.ambassadorName) ||
            text(assignedAmbassador.full_name) ||
            ambassadorId,
          assignmentType:
            text(body.assignment_type) ||
            text(assignment.assignmentType) ||
            "primary",
          decision,
          managerName,
          note: decisionNote,
          decidedAt,
        },
        ...assignmentHistory,
      ],
      approvalManager: managerName,
    }

    const snapshotBeforeTerritoryUpdate =
      await loadAmbassadorWorkspaceSnapshot()
    const snapshot = snapshotBeforeTerritoryUpdate.snapshot
    if (!snapshot) {
      return ambassadorJson({ ok: false, source: "ambassador-territory-approval", error: "Ambassador workspace snapshot unavailable" })
    }

    const activeCount =
      decision === "approved"
        ? snapshot.ambassadors.filter(
            (item: Row) =>
              text(item.territory_id) === territoryId &&
              !["archived", "suspended", "inactive"].some((status) =>
                text(item.status || item.lifecycle_stage)
                  .toLowerCase()
                  .includes(status),
              ),
          ).length
        : Number(
            territoryResult.record.active_ambassadors_count || 0,
          )

    const remainingPending = asRows(
      nextConfig.pendingAssignments,
    ).length

    const nextTerritoryStatus =
      decision === "approved"
        ? "active"
        : activeCount > 0
          ? territoryResult.record.status || "active"
          : remainingPending > 0
            ? "pending_approval"
            : "rejected"

    const territoryUpdate = await updateAmbassadorEntity(
      "territories",
      territoryId,
      {
        manager_name: managerName,
        active_ambassadors_count: activeCount,
        status: nextTerritoryStatus,
        notes: serializeNotes(nextConfig),
      },
    )

    if (!territoryUpdate.ok || !territoryUpdate.record) {
      return ambassadorJson({
        ok: false,
        source: "ambassador-territory-approval",
        error:
          territoryUpdate.error ||
          "The territory decision could not be persisted",
      })
    }

    await createAmbassadorEntity("audit", {
      entity_type: "territories",
      entity_id: territoryId,
      action:
        decision === "approved"
          ? "territory_assignment_approved"
          : "territory_assignment_rejected",
      summary: `${
        decision === "approved" ? "Approved" : "Rejected"
      } territory assignment for ${
        text(assignment.ambassadorName) || ambassadorId
      }`,
      actor_name: managerName,
      payload: {
        territory_id: territoryId,
        assignment_id: assignmentId,
        ambassador_id: ambassadorId,
        assignment_type:
          body.assignment_type ||
          assignment.assignmentType ||
          "primary",
        decision,
        decision_note: decisionNote || null,
        decided_at: decidedAt,
      },
    })

    const finalSnapshot = await loadAmbassadorWorkspaceSnapshot()

    return ambassadorJson({
      ok: true,
      source: "ambassador-territory-approval",
      decision,
      territory: territoryUpdate.record,
      ambassador: assignedAmbassador,
      snapshot: finalSnapshot.snapshot,
    })
  } catch (error) {
    return ambassadorJson({
      ok: false,
      source: "ambassador-territory-approval",
      error:
        error instanceof Error
          ? error.message
          : "Territory approval failed",
    })
  }
}
