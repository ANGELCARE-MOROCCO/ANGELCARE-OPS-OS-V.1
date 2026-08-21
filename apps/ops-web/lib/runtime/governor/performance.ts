import { readFile } from 'node:fs/promises'

import {
  createEmailOSCoreDb,
} from '@/lib/email-os-core/db'
import {
  getAngelCareGovernorConfig,
} from '@/lib/runtime/governor/config'
import {
  getEventLoopPressureSnapshot,
} from '@/lib/runtime/governor/event-loop'
import {
  getGovernorMetricsSnapshot,
} from '@/lib/runtime/governor/metrics'
import {
  angelCareSingleFlight,
} from '@/lib/runtime/governor/single-flight'
import {
  getAngelCareRedisClient,
  isAngelCareRedisConfigured,
  withAngelCareRedisDeadline,
} from '@/lib/runtime/redis/server'

async function readText(path: string) {
  try {
    return (
      await readFile(path, 'utf8')
    ).trim()
  } catch {
    return ''
  }
}

async function cgroupMemory() {
  const [currentRaw, maxRaw] = await Promise.all([
    readText('/sys/fs/cgroup/memory.current'),
    readText('/sys/fs/cgroup/memory.max'),
  ])

  const current = Number(currentRaw)
  const max = maxRaw === 'max'
    ? 0
    : Number(maxRaw)

  const validCurrent = Number.isFinite(current)
    ? current
    : 0

  const validMax = Number.isFinite(max)
    ? max
    : 0

  return {
    currentBytes: validCurrent,
    limitBytes: validMax,
    percent:
      validMax > 0
        ? Math.round(
            (
              validCurrent /
              validMax
            ) * 10_000,
          ) / 100
        : 0,
  }
}

function infoNumber(
  raw: string,
  key: string,
) {
  const line = raw
    .split(/\r?\n/)
    .find((value) =>
      value.startsWith(`${key}:`),
    )

  const parsed = Number(
    line?.slice(key.length + 1),
  )

  return Number.isFinite(parsed)
    ? parsed
    : null
}

async function redisSnapshot() {
  if (!isAngelCareRedisConfigured()) {
    return {
      configured: false,
      ok: false,
      latencyMs: null,
      memoryUsedBytes: null,
      connectedClients: null,
    }
  }

  const startedAt = performance.now()

  try {
    const client = await getAngelCareRedisClient()

    if (!client) {
      return {
        configured: true,
        ok: false,
        latencyMs: null,
        memoryUsedBytes: null,
        connectedClients: null,
      }
    }

    const [pong, memoryInfo, clientsInfo] =
      await withAngelCareRedisDeadline(
        Promise.all([
          client.ping(),
          client.info('memory'),
          client.info('clients'),
        ]),
        750,
      )

    return {
      configured: true,
      ok: pong === 'PONG',
      latencyMs: Math.round(
        (performance.now() - startedAt) * 100,
      ) / 100,
      memoryUsedBytes:
        infoNumber(
          memoryInfo,
          'used_memory',
        ),
      connectedClients:
        infoNumber(
          clientsInfo,
          'connected_clients',
        ),
    }
  } catch {
    return {
      configured: true,
      ok: false,
      latencyMs: null,
      memoryUsedBytes: null,
      connectedClients: null,
    }
  }
}

async function emailQueueSnapshot() {
  try {
    const db = createEmailOSCoreDb()

    const statuses = [
      'queued',
      'pending',
      'retry',
      'processing',
      'failed',
    ] as const

    const values = await Promise.all(
      statuses.map(
        async (status) => {
          const result = await db
            .from('email_os_core_queue')
            .select('id', {
              count: 'exact',
              head: true,
            })
            .eq('status', status)

          return {
            status,
            count:
              result.error
                ? null
                : result.count || 0,
            error:
              result.error?.message || null,
          }
        },
      ),
    )

    const counts = Object.fromEntries(
      values.map((item) => [
        item.status,
        item.count,
      ]),
    ) as Record<string, number | null>

    return {
      ok: values.every(
        (item) => !item.error,
      ),
      queued:
        (counts.queued || 0) +
        (counts.pending || 0),
      pending: counts.pending,
      retry: counts.retry,
      processing: counts.processing,
      failed: counts.failed,
    }
  } catch {
    return {
      ok: false,
      queued: null,
      pending: null,
      retry: null,
      processing: null,
      failed: null,
    }
  }
}

function pressureState(input: {
  memoryPercent: number
  eventLoopP95Ms: number
  redisOk: boolean
  redisConfigured: boolean
}) {
  if (
    input.memoryPercent >= 92 ||
    input.eventLoopP95Ms >= 300 ||
    (
      input.redisConfigured &&
      !input.redisOk
    )
  ) {
    return 'critical'
  }

  if (
    input.memoryPercent >= 82 ||
    input.eventLoopP95Ms >= 160
  ) {
    return 'saturated'
  }

  if (
    input.memoryPercent >= 68 ||
    input.eventLoopP95Ms >= 75
  ) {
    return 'elevated'
  }

  return 'healthy'
}

async function readPerformanceSnapshot() {
  const [memory, redis, emailQueue] =
    await Promise.all([
      cgroupMemory(),
      redisSnapshot(),
      emailQueueSnapshot(),
    ])

  const eventLoop = getEventLoopPressureSnapshot()
  const processMemory = process.memoryUsage()
  const config = getAngelCareGovernorConfig()
  const governor = getGovernorMetricsSnapshot()

  return {
    ok: true,
    service: 'angelcare-saas-ops',
    generatedAt: new Date().toISOString(),
    pressure: pressureState({
      memoryPercent: memory.percent,
      eventLoopP95Ms: eventLoop.p95Ms,
      redisOk: redis.ok,
      redisConfigured: redis.configured,
    }),
    process: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      rssBytes: processMemory.rss,
      heapUsedBytes: processMemory.heapUsed,
      heapTotalBytes: processMemory.heapTotal,
      externalBytes: processMemory.external,
    },
    containerMemory: memory,
    eventLoop,
    redis,
    emailQueue,
    governor: {
      config,
      metrics: governor,
    },
  }
}

export function getAngelCarePerformanceSnapshot() {
  return angelCareSingleFlight(
    'opsos:performance:snapshot',
    readPerformanceSnapshot,
    1_500,
  )
}
