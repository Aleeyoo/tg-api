import type { TelegramConfig } from '../../core/config'

export interface ChannelResult {
  allowed: boolean
  config?: TelegramConfig
  error?: { code: string; message: string }
  /** Cache strategy for this channel: 'kv+lru' | 'lru_only' | 'upstream' */
  cacheStrategy?: string
}

/**
 * Resolve channel access and caching config from env + URL param.
 *
 * Rules:
 * - No CHANNELS set → any channel allowed, LRU only
 * - CHANNELS set + channel in list → KV + LRU
 * - CHANNELS set + channel NOT in list → LRU only (or 403 if STRICT_MODE)
 */
export function getChannelConfig(
  env: Record<string, string | undefined>,
  channel: string,
): ChannelResult {
  const channelsStr = env.CHANNELS || ''
  const allowedChannels = channelsStr.split(',').map(s => s.trim()).filter(Boolean)
  const strictMode = env.STRICT_MODE === 'true'
  const inWhitelist = allowedChannels.includes(channel)

  // Strict mode: reject non-whitelisted channels
  if (strictMode && allowedChannels.length > 0 && !inWhitelist) {
    return {
      allowed: false,
      error: {
        code: 'CHANNEL_NOT_ALLOWED',
        message: `Channel '${channel}' is not in the allowed list`,
      },
    }
  }

  return {
    allowed: true,
    config: {
      channel,
      telegramHost: env.TELEGRAM_HOST || 't.me',
      staticProxy: env.STATIC_PROXY || '/static/',
      reactionsEnabled: Boolean(env.REACTIONS),
    },
    cacheStrategy: inWhitelist ? 'kv+lru' : 'lru_only',
  }
}

/**
 * Get cache TTL from env with fallback.
 */
export function getCacheTtl(env: Record<string, string | undefined>): number {
  const ttl = Number(env.CACHE_TTL)
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 300
}
