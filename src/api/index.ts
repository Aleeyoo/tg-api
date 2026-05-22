import { Hono } from 'hono'
import { corsMiddleware } from './middleware/cors'
import { cacheControlMiddleware } from './middleware/cache'
import { infoRouter } from './routes/info'
import { postsRouter } from './routes/posts'
import { mediaRouter } from './routes/media'
import { tagsRouter } from './routes/tags'
import { heatmapRouter } from './routes/heatmap'

const app = new Hono<{ Bindings: { CACHE: KVNamespace } }>()

// Global middleware
app.use('*', corsMiddleware)
app.use('*', cacheControlMiddleware)

// ── 多频道命名空间 /api/v1/ch/:channel ──
const ch = new Hono<{ Bindings: { CACHE: KVNamespace } }>()

ch.route('/:channel/info', infoRouter)
ch.route('/:channel/posts', postsRouter)
ch.route('/:channel/media', mediaRouter)
ch.route('/:channel/tags', tagsRouter)
ch.route('/:channel/heatmap', heatmapRouter)

// List available channels (when CHANNELS is set)
ch.get('/', (c) => {
  const channels = (c.env as any).CHANNELS as string | undefined
  if (!channels) {
    return c.json({ channels: [] })
  }
  return c.json({
    channels: channels.split(',').map(s => s.trim()).filter(Boolean),
  })
})

app.route('/api/v1/ch', ch)

// ── 全局端点 ──
app.get('/api/v1/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/', (c) => {
  return c.json({
    name: 'tg-api',
    version: '0.1.0',
    description: 'Telegram structured data service',
    endpoints: {
      channels: '/api/v1/ch',
      channelInfo: '/api/v1/ch/:channel/info',
      posts: '/api/v1/ch/:channel/posts',
      post: '/api/v1/ch/:channel/posts/:id',
      mediaImages: '/api/v1/ch/:channel/media/images',
      mediaVideos: '/api/v1/ch/:channel/media/videos',
      tags: '/api/v1/ch/:channel/tags',
      heatmap: '/api/v1/ch/:channel/heatmap',
      health: '/api/v1/health',
    },
  })
})

export default app
