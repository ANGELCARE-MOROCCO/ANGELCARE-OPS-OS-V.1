type Flight<T> = {
  createdAt: number
  promise: Promise<T>
}

type FlightGlobal = typeof globalThis & {
  __angelcareSingleFlights?: Map<string, Flight<unknown>>
}

function flights() {
  const globalState = globalThis as FlightGlobal

  if (!globalState.__angelcareSingleFlights) {
    globalState.__angelcareSingleFlights = new Map()
  }

  return globalState.__angelcareSingleFlights
}

export async function angelCareSingleFlight<T>(
  key: string,
  operation: () => Promise<T>,
  maxAgeMs = 2_000,
): Promise<T> {
  const normalized = key.trim().slice(0, 180)
  const currentFlights = flights()
  const now = Date.now()
  const existing = currentFlights.get(normalized)

  if (
    existing &&
    now - existing.createdAt <= maxAgeMs
  ) {
    return existing.promise as Promise<T>
  }

  if (currentFlights.size >= 128) {
    for (const [candidateKey, flight] of currentFlights) {
      if (now - flight.createdAt > maxAgeMs) {
        currentFlights.delete(candidateKey)
      }
    }
  }

  const promise = operation()

  currentFlights.set(
    normalized,
    {
      createdAt: now,
      promise,
    },
  )

  try {
    return await promise
  } finally {
    const latest = currentFlights.get(normalized)

    if (latest?.promise === promise) {
      currentFlights.delete(normalized)
    }
  }
}
