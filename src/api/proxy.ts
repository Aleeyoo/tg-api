import type { Context, Env } from 'hono'

interface ProxyEnv extends Env {
  Bindings: {
    CACHE: KVNamespace
    REFERERS?: string
  }
}

/**
 * Parse the domain from a Referer or Origin header.
 * Returns null if the header is missing or malformed.
 */
function extractDomain(header: string | null): string | null {
  if (!header) return null
  try {
    return new URL(header).hostname
  } catch {
    return null
  }
}

/**
 * Validate the request origin against the REFERERS whitelist.
 */
function isRefererAllowed(request: Request, referersEnv: string | undefined): boolean {
  // No whitelist configured → allow all
  if (!referersEnv) return true

  const allowedDomains = referersEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (allowedDomains.length === 0) return true

  const origin = request.headers.get('Origin')
  const referer = request.headers.get('Referer')
  const domain = extractDomain(origin) ?? extractDomain(referer)

  if (!domain) return false

  return allowedDomains.includes(domain.toLowerCase())
}

/**
 * Proxy handler for GET /static/* requests.
 * Fetches media from Telegram CDN and returns it with proper headers.
 */
export async function handleStaticProxy(c: Context<ProxyEnv>): Promise<Response> {
  const referers = c.env?.REFERERS

  // Referer validation
  if (!isRefererAllowed(c.req.raw, referers)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Extract target URL from path: /static/https://cdn5.telesco.pe/photo.jpg
  const targetUrl = c.req.path.replace(/^\/static\//, '')
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return new Response(JSON.stringify({ error: 'Bad Request: invalid target URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build upstream fetch headers — pass through Range for video seeking
  const upstreamHeaders = new Headers()
  const range = c.req.header('Range')
  if (range) {
    upstreamHeaders.set('Range', range)
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders,
    })

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build response with headers to forward
    const responseHeaders = new Headers()

    // CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type')

    // Cache: Telegram CDN media is immutable
    responseHeaders.set('Cache-Control', 'public, s-maxage=86400, immutable')

    // Forward content type
    const contentType = upstream.headers.get('Content-Type')
    if (contentType) {
      responseHeaders.set('Content-Type', contentType)
    }

    // Forward content length (for Range responses)
    const contentLength = upstream.headers.get('Content-Length')
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength)
    }

    // Forward content range (for 206 responses)
    const contentRange = upstream.headers.get('Content-Range')
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange)
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
