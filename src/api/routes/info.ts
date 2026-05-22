import { Hono } from 'hono'
import { TelegramClient } from '../../core'
import { getChannelConfig, getCacheTtl } from '../helpers/channel'
import { withKvCache } from '../middleware/cache'

const router = new Hono<{ Bindings: { CACHE: KVNamespace } }>()

function getCtx(c: any) {
  const channel = c.req.param('channel')
  if (!channel) return null
  const env = c.env as any
  const result = getChannelConfig(env, channel)
  if (!result.allowed) return { error: result.error }
  return { channel, config: result.config!, ttl: getCacheTtl(env), env, cacheStrategy: result.cacheStrategy }
}

// GET /api/v1/ch/:channel/info
router.get('/', async (c) => {
  const ctx = getCtx(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const info = await withKvCache(ctx.env.CACHE, `channel:${ctx.channel}`, ctx.ttl, () =>
    client.getChannelInfo(c.req.raw))

  return c.json(info)
})

export { router as infoRouter }
