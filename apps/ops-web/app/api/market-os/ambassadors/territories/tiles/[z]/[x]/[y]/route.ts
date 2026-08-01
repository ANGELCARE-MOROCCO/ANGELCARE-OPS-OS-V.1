import type { NextRequest } from "next/server"

export const runtime = "nodejs"
export const revalidate = 604800

type TileRouteContext = {
  params: Promise<{
    z: string
    x: string
    y: string
  }>
}

function parseInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null

  const parsed = Number(value)

  return Number.isSafeInteger(parsed)
    ? parsed
    : null
}

function resolveUpstreamUrl(
  template: string,
  z: number,
  x: number,
  y: number,
): string {
  return template
    .replaceAll("{z}", String(z))
    .replaceAll("{x}", String(x))
    .replaceAll("{y}", String(y))
}

export async function GET(
  _request: NextRequest,
  context: TileRouteContext,
): Promise<Response> {
  const params = await context.params

  const z = parseInteger(params.z)
  const x = parseInteger(params.x)
  const y = parseInteger(params.y)

  if (z === null || x === null || y === null) {
    return Response.json(
      {
        error: "Invalid map tile coordinates",
      },
      {
        status: 400,
      },
    )
  }

  if (z < 0 || z > 19) {
    return Response.json(
      {
        error: "Unsupported map zoom level",
      },
      {
        status: 400,
      },
    )
  }

  const tileGridSize = 2 ** z

  if (
    x < 0 ||
    y < 0 ||
    x >= tileGridSize ||
    y >= tileGridSize
  ) {
    return Response.json(
      {
        error: "Map tile is outside the valid grid",
      },
      {
        status: 400,
      },
    )
  }

  const upstreamTemplate =
    process.env.AMBASSADOR_MAP_TILE_UPSTREAM?.trim() ||
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png"

  const upstreamUrl = resolveUpstreamUrl(
    upstreamTemplate,
    z,
    x,
    y,
  )

  const userAgent =
    process.env.AMBASSADOR_MAP_TILE_USER_AGENT?.trim() ||
    "AngelCare-Territory-Command/1.0 (backoffice@angelcarehub.com)"

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/png,image/webp,image/*;q=0.9,*/*;q=0.5",
        "User-Agent": userAgent,
      },
      next: {
        revalidate: 604800,
      },
    })

    if (!upstreamResponse.ok) {
      console.error(
        "[Ambassador Territory Map] Tile provider failure",
        {
          status: upstreamResponse.status,
          z,
          x,
          y,
        },
      )

      return Response.json(
        {
          error: "Map tile provider unavailable",
          status: upstreamResponse.status,
        },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      )
    }

    const tile = await upstreamResponse.arrayBuffer()

    if (tile.byteLength === 0) {
      return Response.json(
        {
          error: "Map tile provider returned an empty response",
        },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      )
    }

    return new Response(tile, {
      status: 200,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ||
          "image/png",

        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",

        "X-AngelCare-Map-Source":
          "OpenStreetMap",
      },
    })
  } catch (error) {
    console.error(
      "[Ambassador Territory Map] Tile request failed",
      error,
    )

    return Response.json(
      {
        error: "Map tile request failed",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  }
}
