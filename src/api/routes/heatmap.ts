import { Hono } from 'hono'
import { TelegramClient } from '../../core'
import { getChannelConfig, getCacheTtl } from '../helpers/channel'
import { withKvCache } from '../middleware/cache'
import dayjs from 'dayjs'

const router = new Hono<{ Bindings: { CACHE: KVNamespace } }>()

function getCtx(c: any) {
  const channel = c.req.param('channel')
  if (!channel) return null
  const env = c.env as any
  const result = getChannelConfig(env, channel)
  if (!result.allowed) return { error: result.error }
  return { channel, config: result.config!, ttl: getCacheTtl(env), env, cacheStrategy: result.cacheStrategy }
}

// GET /api/v1/ch/:channel/heatmap?year=2026
router.get('/', async (c) => {
  const ctx = getCtx(c)
  if (!ctx) return c.json({ error: { code: 'MISSING_CHANNEL', message: 'Channel parameter is required' } }, 400)
  if ('error' in ctx) return c.json({ error: ctx.error }, 403)
  c.header('X-Tg-Cache', ctx.cacheStrategy || 'unknown')

  const client = new TelegramClient(ctx.config)
  const year = c.req.query('year') || String(new Date().getFullYear())
  const cacheKey = JSON.stringify({ scope: 'heatmap', year, channel: ctx.channel })

  const heatmap = await withKvCache(
    ctx.env.CACHE,
    cacheKey,
    Math.max(ctx.ttl, 600),
    async () => {
      const posts = await client.getPosts({}, c.req.raw)
      const dailyCounts = new Map<string, number>()

      for (const post of posts) {
        const date = dayjs(post.datetime).format('YYYY-MM-DD')
        if (date.startsWith(year)) {
          dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1)
        }
      }

      const data: Array<{ date: string; count: number }> = []
      const startDate = dayjs(`${year}-01-01`)
      const endDate = dayjs(`${year}-12-31`)
      let current = startDate

      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        const dateStr = current.format('YYYY-MM-DD')
        data.push({ date: dateStr, count: dailyCounts.get(dateStr) || 0 })
        current = current.add(1, 'day')
      }

      return { year: Number(year), total: dailyCounts.size, data }
    },
  )

  return c.json(heatmap)
})

export { router as heatmapRouter }
