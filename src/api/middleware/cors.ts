import type { MiddlewareHandler } from 'hono'

/**
 * CORS middleware — allow all origins for development.
 * Can be tightened per production domain later.
 */
export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}
