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

// GET /api/v1/ch/:channel/tags
router.get('/', async (c) => {
  const ctx = getCtx(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const cacheKey = JSON.stringify({ scope: 'tags', channel: ctx.channel })
  const posts = await withKvCache(ctx.env.CACHE, cacheKey, ctx.ttl, () => client.getPosts({}, c.req.raw))

  const tagCounts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }

  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return c.json({ tags })
})

export { router as tagsRouter }
