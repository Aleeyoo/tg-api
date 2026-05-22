import { $fetch } from 'ofetch'
import type { TelegramConfig } from './config'

const UNNECESSARY_HEADERS = new Set(['host', 'cookie', 'origin', 'referer'])

export interface FetchOptions {
  before?: string
  after?: string
  q?: string
  id?: string
}

function stripUnnecessaryHeaders(request?: Request): Record<string, string> {
  if (!request) return {}

  const headers = Object.fromEntries(request.headers.entries())
  for (const key of Object.keys(headers)) {
    if (UNNECESSARY_HEADERS.has(key)) {
      delete headers[key]
    }
  }
  return headers
}

/**
 * Fetch a Telegram channel page (HTML) via t.me.
 * Returns raw HTML string for the parser to consume.
 */
export async function fetchChannelDocument(
  config: TelegramConfig,
  options: FetchOptions = {},
  request?: Request,
): Promise<string> {
  const { before, after, q, id } = options
  const host = config.telegramHost ?? 't.me'
  const channel = config.channel

  const requestUrl = id
    ? `https://${host}/${channel}/${id}?embed=1&mode=tme`
    : `https://${host}/s/${channel}`

  console.info('[fetcher] Fetching', requestUrl, { before, after, q, id })

  return $fetch<string>(requestUrl, {
    headers: stripUnnecessaryHeaders(request),
    query: {
      before: before || undefined,
      after: after || undefined,
      q: q || undefined,
    },
    retry: 3,
    retryDelay: 100,
  })
}
