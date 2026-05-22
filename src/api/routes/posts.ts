import { Hono } from 'hono'
import { TelegramClient } from '../../core'
import { getChannelConfig, getCacheTtl } from '../helpers/channel'
import { withKvCache } from '../middleware/cache'

const router = new Hono<{ Bindings: { CACHE: KVNamespace } }>()

function getCtxEnv(c: any) {
  const channel = c.req.param('channel')
  if (!channel) return null
  const env = c.env as any
  const result = getChannelConfig(env, channel)
  if (!result.allowed) return { error: result.error }
  return { channel, config: result.config!, ttl: getCacheTtl(env), env, cacheStrategy: result.cacheStrategy }
}

// GET /api/v1/ch/:channel/posts
router.get('/', async (c) => {
  const ctx = getCtxEnv(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const before = c.req.query('before')
  const after = c.req.query('after')
  const q = c.req.query('q')
  const cacheKey = JSON.stringify({ scope: 'posts', before, after, q, channel: ctx.channel })

  const posts = await withKvCache(ctx.env.CACHE, cacheKey, ctx.ttl, () =>
    client.getPosts({ before, after, q }, c.req.raw))

  return c.json({ posts })
})

// GET /api/v1/ch/:channel/posts/:id
router.get('/:id', async (c) => {
  const ctx = getCtxEnv(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const id = c.req.param('id')
  const cacheKey = JSON.stringify({ scope: 'post', id, channel: ctx.channel })

  const post = await withKvCache(ctx.env.CACHE, cacheKey, ctx.ttl, () =>
    client.getPost(id, c.req.raw))

  return c.json(post)
})

export { router as postsRouter }
