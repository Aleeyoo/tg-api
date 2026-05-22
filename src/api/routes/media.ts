import { Hono } from 'hono'
import { TelegramClient } from '../../core'
import { getChannelConfig, getCacheTtl } from '../helpers/channel'
import { withKvCache } from '../middleware/cache'
import type { ImageBlock, VideoBlock } from '../../core/types'

const router = new Hono<{ Bindings: { CACHE: KVNamespace } }>()

function getCtx(c: any) {
  const channel = c.req.param('channel')
  if (!channel) return null
  const env = c.env as any
  const result = getChannelConfig(env, channel)
  if (!result.allowed) return { error: result.error }
  return { channel, config: result.config!, ttl: getCacheTtl(env), env, cacheStrategy: result.cacheStrategy }
}

// GET /api/v1/ch/:channel/media/images
router.get('/images', async (c) => {
  const ctx = getCtx(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const cacheKey = JSON.stringify({ scope: 'media-images', channel: ctx.channel })
  const posts = await withKvCache(ctx.env.CACHE, cacheKey, ctx.ttl, () => client.getPosts({}, c.req.raw))

  const items: Array<{ postId: string; postTitle: string; image: ImageBlock }> = []
  for (const post of posts) {
    for (const block of post.blocks) {
      if (block.type === 'image') items.push({ postId: post.id, postTitle: post.title, image: block })
    }
  }
  return c.json({ items })
})

// GET /api/v1/ch/:channel/media/videos
router.get('/videos', async (c) => {
  const ctx = getCtx(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const cacheKey = JSON.stringify({ scope: 'media-videos', channel: ctx.channel })
  const posts = await withKvCache(ctx.env.CACHE, cacheKey, ctx.ttl, () => client.getPosts({}, c.req.raw))

  const items: Array<{ postId: string; postTitle: string; video: VideoBlock }> = []
  for (const post of posts) {
    for (const block of post.blocks) {
      if (block.type === 'video') items.push({ postId: post.id, postTitle: post.title, video: block })
    }
  }
  return c.json({ items })
})

export { router as mediaRouter }
