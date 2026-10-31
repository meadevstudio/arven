const HOUR_MS = 60 * 60 * 1000
const UPSTREAM_TIMEOUT_MS = 6000

// Both providers publish reference rates. These are not live trading quotes.
const providers = [
  {
    source: 'Frankfurter',
    url: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY',
    parse(payload) {
      if (payload?.base !== 'USD') throw new Error('Unexpected base currency')
      return { rate: payload?.rates?.TRY, rateDate: payload?.date }
    }
  },
  {
    source: 'ExchangeRate-API',
    url: 'https://open.er-api.com/v6/latest/USD',
    parse(payload) {
      if (payload?.result !== 'success' || payload?.base_code !== 'USD') {
        throw new Error('Unexpected provider response')
      }
      const timestamp = payload?.time_last_update_unix
      if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error('Invalid rate date')
      return {
        rate: payload?.rates?.TRY,
        rateDate: new Date(timestamp * 1000).toISOString().slice(0, 10)
      }
    }
  }
]

function validateRate({ rate, rateDate }) {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid USD/TRY rate')
  }
  if (typeof rateDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rateDate)) {
    throw new Error('Invalid rate date')
  }
  const parsedDate = new Date(`${rateDate}T00:00:00.000Z`)
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== rateDate) {
    throw new Error('Invalid rate date')
  }
  return { rate, rateDate }
}

async function fetchProvider(provider, fetchImpl, timeoutMs) {
  const controller = new AbortController()
  let timeout
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(provider.url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        })
        if (!response.ok) throw new Error('Rate provider unavailable')
        return validateRate(provider.parse(await response.json()))
      })(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort()
          reject(new Error('Rate provider timed out'))
        }, timeoutMs)
      })
    ])
  } finally {
    clearTimeout(timeout)
  }
}

// The factory makes fallback, expiration and failure handling testable without
// network access. The default instance below shares its cache across warm calls.
export function createExchangeRateService({ fetchImpl = fetch, now = Date.now, timeoutMs = UPSTREAM_TIMEOUT_MS } = {}) {
  let cached = null
  let inFlight = null

  async function refresh() {
    for (const provider of providers) {
      try {
        const value = await fetchProvider(provider, fetchImpl, timeoutMs)
        cached = { ...value, source: provider.source, fetchedAt: new Date(now()).toISOString(), stale: false }
        return { ...cached }
      } catch {
        // A failed/invalid primary response must still try the second provider.
      }
    }
    if (cached) return { ...cached, stale: true }
    throw new Error('USD/TRY reference rate is temporarily unavailable')
  }

  return {
    async getRate() {
      if (cached && now() - Date.parse(cached.fetchedAt) < HOUR_MS) return { ...cached }
      if (!inFlight) inFlight = refresh().finally(() => { inFlight = null })
      return { ...await inFlight }
    }
  }
}

export function createHandler(service = createExchangeRateService(), { now = Date.now } = {}) {
  return async function handler(req, res) {
    const sendJson = (status, payload) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(payload))
    }
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      res.setHeader('Cache-Control', 'no-store')
      return sendJson(405, { error: 'Method not allowed' })
    }
    try {
      const value = await service.getRate()
      const fetchedAt = Date.parse(value.fetchedAt)
      const ageMs = now() - fetchedAt
      // A new CDN POP must not extend the warm module's remaining cache life.
      // Unparseable or future timestamps are not safe to cache.
      const maxAge = Number.isFinite(ageMs) && ageMs >= 0
        ? Math.max(1, Math.min(3600, Math.floor((HOUR_MS - ageMs) / 1000)))
        : null
      res.setHeader('Cache-Control', maxAge === null
        ? 'no-store'
        : `public, max-age=0, s-maxage=${value.stale ? 60 : maxAge}`)
      return sendJson(200, value)
    } catch {
      res.setHeader('Cache-Control', 'no-store')
      return sendJson(503, { error: 'USD/TRY reference rate is temporarily unavailable' })
    }
  }
}

export default createHandler()
