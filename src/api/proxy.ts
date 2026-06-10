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
export async function handleStaticProxy(c: any): Promise<Response> {
  const referers = (c.env as any)?.REFERERS as string | undefined

  // Referer validation
  if (!isRefererAllowed(c.req.raw, referers)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Extract target URL from path: /static/https://cdn5.telesco.pe/photo.jpg
  // Preserve query string (e.g. ?token=...) for CDN authentication
  const reqUrl = new URL(c.req.url)
  const targetUrl = reqUrl.pathname.replace(/^\/static\//, '') + reqUrl.search
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return c.json({ error: 'Bad Request: invalid target URL' }, 400)
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
      return c.json({ error: 'Upstream fetch failed' }, upstream.status as any)
    }

    // Build response with headers to forward
    // NOTE: Use Record<string, string> (not Headers) because c.newResponse()
    // expects a plain object as the third argument.
    const responseHeaders: Record<string, string> = {}

    // CORS headers
    responseHeaders['Access-Control-Allow-Origin'] = '*'
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type'

    // Cache: Telegram CDN media is immutable
    responseHeaders['Cache-Control'] = 'public, s-maxage=86400, immutable'

    // Forward content type
    const contentType = upstream.headers.get('Content-Type')
    if (contentType) {
      responseHeaders['Content-Type'] = contentType
    }

    // Forward content length (for Range responses)
    const contentLength = upstream.headers.get('Content-Length')
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    // Forward content range (for 206 responses)
    const contentRange = upstream.headers.get('Content-Range')
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }

    return c.newResponse(upstream.body, upstream.status as any, responseHeaders)
  } catch {
    return c.json({ error: 'Proxy error' }, 502)
  }
}
