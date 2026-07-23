import { NextResponse } from "next/server"

import {
  AmbassadorLifecycleError,
  executeLifecycleAction,
  loadLifecycleDashboard,
  type LifecycleAction,
} from "@/lib/market-os/ambassadors/data-lifecycle"

export const dynamic = "force-dynamic"
export const revalidate = 0

type RouteContext = {
  params:
    | Promise<{ action?: string[] }>
    | { action?: string[] }
}

function success(
  data: unknown,
  status = 200,
) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  )
}

function failure(error: unknown) {
  if (
    error instanceof
    AmbassadorLifecycleError
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        error: error.message,
        details: error.details,
      },
      {
        status: error.status,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    )
  }

  return NextResponse.json(
    {
      ok: false,
      code: "INTERNAL_ERROR",
      error:
        error instanceof Error
          ? error.message
          : "Unexpected lifecycle failure.",
    },
    {
      status: 500,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  )
}

async function getSegments(
  context: RouteContext,
) {
  const parameters =
    await Promise.resolve(context.params)

  return Array.isArray(parameters.action)
    ? parameters.action
    : []
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const segments =
      await getSegments(context)

    if (segments.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "METHOD_NOT_SUPPORTED",
          error:
            "GET is available only on the Data Lifecycle root.",
        },
        { status: 405 },
      )
    }

    return success(
      await loadLifecycleDashboard(),
    )
  } catch (error) {
    return failure(error)
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const segments =
      await getSegments(context)

    const body =
      await request.json().catch(
        () => ({}),
      )

    const routeKey = segments.join("/")

    let action:
      | LifecycleAction
      | null = null

    if (routeKey === "preview") {
      action = "preview"
    }

    if (routeKey === "archive") {
      action = "archive"
    }

    if (routeKey === "restore") {
      action = "restore"
    }

    if (routeKey === "anonymize") {
      action = "anonymize"
    }

    if (routeKey === "request") {
      action = "request"
    }

    if (routeKey === "delete") {
      action = "delete"
    }

    if (
      segments[0] === "requests" &&
      segments[1] &&
      segments[2] === "approve"
    ) {
      action = "approve"
      body.requestId = segments[1]
    }

    if (
      segments[0] === "requests" &&
      segments[1] &&
      segments[2] === "reject"
    ) {
      action = "reject"
      body.requestId = segments[1]
    }

    if (
      segments[0] === "requests" &&
      segments[1] &&
      segments[2] === "execute"
    ) {
      action = "execute"
      body.requestId = segments[1]
    }

    if (!action) {
      return NextResponse.json(
        {
          ok: false,
          code:
            "UNKNOWN_LIFECYCLE_ACTION",
          error:
            "Unknown Data Lifecycle action.",
        },
        { status: 404 },
      )
    }

    return success(
      await executeLifecycleAction(
        action,
        body,
      ),
      action === "request" ? 201 : 200,
    )
  } catch (error) {
    return failure(error)
  }
}
