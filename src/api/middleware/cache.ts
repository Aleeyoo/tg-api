import type { MiddlewareHandler } from 'hono'

/**
 * Cache control middleware — sets HTTP caching headers.
 */
export const cacheControlMiddleware: MiddlewareHandler = async (c, next) => {
  await next()

  if (!c.res.headers.has('Cache-Control')) {
    c.res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  }
}

/**
 * Helper to get/set KV cache.
 */
export async function withKvCache<T>(
  kv: KVNamespace | undefined,
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  if (!kv) return fetchFn()

  const cached = await kv.get(key, 'json')
  if (cached !== null) return cached as T

  const data = await fetchFn()

  try {
    await kv.put(key, JSON.stringify(data), { expirationTtl: ttl })
  } catch {
    // Non-critical: cache write failure shouldn't break the response
    console.warn('[cache] KV write failed for key:', key)
  }

  return data
}
