# tg-api

**Telegram 结构化数据服务** — 把 Telegram 频道的内容转为类型化的 JSON API。

```
t.me HTML ──▶ core/ 解析管道 ──▶ Block[] ──▶ REST API ──▶ 任意前端
              (纯逻辑)            (结构化)       (JSON)
```

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 本地启动
pnpm dev

# 3. 测试（把 my_channel 换成你的 Telegram 频道名）
curl http://localhost:8787/api/v1/ch/my_channel/info
curl http://localhost:8787/api/v1/ch/my_channel/posts
```

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Aleeyoo/tg-api)

一键部署到 Cloudflare Pages。点击按钮，授权后自动部署。

## API 端点

所有端点返回 JSON，路径前缀 `/api/v1/`。

### 端点概览

| 端点 | 说明 |
|------|------|
| `GET /api/v1/ch` | 列出可用频道（需要设置 `CHANNELS`） |
| `GET /api/v1/ch/:channel/info` | 频道信息（标题、描述、头像） |
| `GET /api/v1/ch/:channel/posts` | 帖子列表（支持翻页和标签筛选） |
| `GET /api/v1/ch/:channel/posts/:id` | 单篇帖子详情 |
| `GET /api/v1/ch/:channel/media/images` | 展平所有图片（图库用） |
| `GET /api/v1/ch/:channel/media/videos` | 展平所有视频（视频站用） |
| `GET /api/v1/ch/:channel/tags` | 标签聚合统计 |
| `GET /api/v1/ch/:channel/heatmap` | GitHub 风格热力图数据 |
| `GET /api/v1/health` | 健康检查 |

教程和示例响应参考下文各节。详细 Block 类型参考见 [Block 类型参考](#block-类型参考)。

### 频道信息

```
GET /api/v1/ch/:channel/info
```

```json
{
  "title": "频道名称",
  "description": "频道描述",
  "descriptionHTML": "<b>频道描述</b>（含 HTML）",
  "avatar": "https://cdn5.telesco.pe/...jpg"
}
```

### 帖子列表

```
GET /api/v1/ch/:channel/posts
```

可选查询参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `before` | string | 游标翻页：获取此 ID 之前的帖子 |
| `after` | string | 游标翻页：获取此 ID 之后的帖子 |
| `q` | string | 按标签筛选（例如 `q=#tech`） |

```json
{
  "posts": [
    {
      "id": "123",
      "title": "帖子标题",
      "datetime": "2026-05-22T10:30:00Z",
      "blocks": [...],
      "tags": ["tech", "news"],
      "reactions": []
    }
  ]
}
```

### 单篇帖子

```
GET /api/v1/ch/:channel/posts/:id
```

```json
{
  "id": "123",
  "title": "帖子标题",
  "datetime": "2026-05-22T10:30:00Z",
  "blocks": [...],
  "tags": [],
  "reactions": []
}
```

### 媒体资源

```
GET /api/v1/ch/:channel/media/images
GET /api/v1/ch/:channel/media/videos
```

展平所有帖子中的图片/视频，适用于图库或视频站前端：

```json
{
  "items": [
    {
      "postId": "123",
      "postTitle": "帖子标题",
      "image": {
        "type": "image",
        "src": "https://cdn5.telesco.pe/...jpg",
        "proxy": "/static/https://...jpg",
        "width": 800,
        "height": 600
      }
    }
  ]
}
```

### 标签聚合

```
GET /api/v1/ch/:channel/tags
```

```json
{
  "tags": [
    { "name": "tech", "count": 12 },
    { "name": "news", "count": 5 }
  ]
}
```

### 热力图

```
GET /api/v1/ch/:channel/heatmap?year=2026
```

可选查询参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `year` | string | 当前年份 | 要查询的年份 |

返回 GitHub contribution graph 风格的数据，包含全年每一天的帖子数量：

```json
{
  "year": 2026,
  "total": 8,
  "data": [
    { "date": "2026-01-01", "count": 0 },
    { "date": "2026-01-02", "count": 0 },
    { "date": "2026-02-27", "count": 1 },
    { "date": "2026-03-02", "count": 4 },
    ...
  ]
}
```

### 健康检查

```
GET /api/v1/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-05-22T07:59:22Z"
}
```

## Block 类型参考

每篇帖子的 `blocks` 数组包含多种类型的内容块：

### `text` — 文本

```json
{
  "id": "block-text-0",
  "type": "text",
  "html": "<b>粗体</b> 普通文本 <a href=\"...\">链接</a>",
  "plain": "粗体 普通文本 链接"
}
```

支持：粗体、斜体、链接、代码高亮、展开块、剧透、自定义表情。

### `image` — 图片

```json
{
  "id": "block-image-0",
  "type": "image",
  "src": "https://cdn5.telesco.pe/...jpg",
  "proxy": "/static/https://...jpg",
  "width": 800,
  "height": 600
}
```

### `video` — 视频

```json
{
  "id": "block-video-0",
  "type": "video",
  "src": "https://cdn5.telesco.pe/...mp4",
  "proxy": "/static/https://...mp4",
  "width": 640,
  "height": 480,
  "isRound": false
}
```

### `audio` — 语音消息

```json
{
  "id": "block-audio-0",
  "type": "audio",
  "src": "https://cdn5.telesco.pe/...ogg",
  "proxy": "/static/https://...ogg"
}
```

### `sticker` — 静态贴纸

```json
{
  "id": "block-sticker-0",
  "type": "sticker",
  "src": "https://cdn5.telesco.pe/...webp",
  "proxy": "/static/https://...webp",
  "width": 256,
  "height": 256
}
```

### `video_sticker` — 动态贴纸

```json
{
  "id": "block-video-sticker-0",
  "type": "video_sticker",
  "src": "https://cdn5.telesco.pe/...mp4",
  "proxy": "/static/https://...mp4",
  "poster": "/static/https://...jpg",
  "width": 256,
  "height": 256
}
```

### `link_preview` — 链接预览

```json
{
  "id": "block-link-preview-0",
  "type": "link_preview",
  "url": "https://example.com/article",
  "title": "文章标题",
  "description": "文章描述",
  "image": "/static/https://...jpg",
  "siteName": "Example"
}
```

### `reply` — 回复引用

```json
{
  "id": "block-reply-0",
  "type": "reply",
  "postId": "122",
  "text": "被回复的帖子摘要..."
}
```

### `poll` — 投票

```json
{
  "id": "block-poll-0",
  "type": "poll",
  "question": "你选哪个？",
  "options": [
    { "label": "选项 A", "percent": "60%" },
    { "label": "选项 B", "percent": "40%" }
  ],
  "totalVotes": "100 votes"
}
```

### `document` — 文件

```json
{
  "id": "block-document-0",
  "type": "document",
  "src": "https://t.me/.../file.pdf",
  "name": "document.pdf",
  "size": 1024000,
  "mimeType": "application/pdf"
}
```

### `location` — 位置

```json
{
  "id": "block-location-0",
  "type": "location",
  "latitude": 31.2304,
  "longitude": 121.4737,
  "image": "/static/https://...jpg"
}
```

## 数据流

```
用户请求
    │
    ▼
Hono 路由 ──→ 允许? (STRICT_MODE + CHANNELS) ──→ 403
    │
    ▼ 允许
KV 缓存命中? ──→ 返回缓存
    │
    ▼ 未命中
LRU 内存缓存? ──→ 命中 → 写入 KV → 返回
    │
    ▼ 都未命中
fetch(t.me/s/{channel}?embed=1)
    │
    ▼
cheerio 解析 HTML
    │
    ▼
extractBlocks() → Block[]
    │
    ▼
写入 LRU → 写入 KV → 返回 JSON
```

两层缓存：
- **LRU**: Worker 内存，5 分钟 TTL
- **KV**: Cloudflare KV，5 分钟 TTL，跨实例共享

## 开发

```bash
# 本地开发（热重载）
pnpm dev

# 类型检查
pnpm typecheck

# 部署
pnpm deploy
```

### 环境变量

| 变量 | 默认值 | 必需 | 说明 |
|------|--------|------|------|
| `CHANNELS` | 空 | ❌ | 白名单（逗号分隔），匹配的频道走 KV 缓存 |
| `STRICT_MODE` | `false` | ❌ | 设为 `true` 时只允许白名单内的频道 |
| `CACHE_TTL` | `300` | ❌ | KV 缓存有效期（秒） |
| `TELEGRAM_HOST` | `t.me` | ❌ | Telegram 服务器地址 |
| `STATIC_PROXY` | `/static/` | ❌ | 静态资源代理前缀 |

本地开发时在 `.dev.vars` 中设置（已加入 `.gitignore`）。不填任何频道变量也能部署——直接用 `/api/v1/ch/:channel/` 即可访问任意频道。

**白名单 vs 非白名单：**
- `CHANNELS` 内频道 → LRU 内存 + KV 持久缓存
- `CHANNELS` 外频道 → 仅 LRU 内存缓存（冷启动回源）
- `STRICT_MODE=true` → 彻底禁止非白名单频道

## 部署

### 一键部署（Cloudflare Pages）

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aleeyoo/tg-api)

点击上方按钮，授权 Cloudflare 访问你的 GitHub 仓库即可自动部署。

### 手动连接

1. 推送代码到 GitHub
2. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
3. 点击 **Create** → **Pages** → **Connect to Git**
4. 选择 tg-api 仓库，框架选 **None**，构建命令留空
5. 部署完成后，在项目 **Settings → Functions → KV namespace bindings** 中添加：

| Binding | 说明 |
|---------|------|
| `CACHE` | 创建或选择一个 KV namespace 用于缓存（可选） |

6. 在 **Settings → Environment variables** 中添加：

| 变量 | 说明 |
|------|------|
| `CHANNELS` | 频道白名单（可选） |
| `STRICT_MODE` | `true` 开启严格模式（可选） |
| `CACHE_TTL` | KV 缓存秒数（可选，默认 300） |

推送代码即自动部署。

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动
pnpm dev
```

> KV 非必需。不绑定 KV namespace 时，所有频道自动使用内存 LRU 缓存，冷启动时会重新抓取 Telegram。

## 项目结构

```
src/
├── core/                  ← 纯逻辑，零框架依赖
│   ├── types.ts           ← Block 联合类型定义
│   ├── client.ts          ← TelegramClient 入口
│   ├── fetcher.ts         ← HTTP 请求
│   ├── parser.ts          ← cheerio 解析
│   ├── cache.ts           ← LRU 缓存适配器
│   ├── channel.ts         ← 频道信息提取
│   └── blocks/            ← 内容提取（12 种类型）
│       ├── index.ts       ← orchestrator
│       ├── text.ts        ← 文本
│       ├── image.ts       ← 图片
│       ├── video.ts       ← 视频
│       ├── audio.ts       ← 语音
│       ├── sticker.ts     ← 静态贴纸
│       ├── video-sticker.ts ← 动态贴纸
│       ├── link-preview.ts ← 链接预览
│       ├── reply.ts       ← 回复引用
│       ├── poll.ts        ← 投票
│       ├── document.ts    ← 文件
│       ├── location.ts    ← 位置
│       ├── reactions.ts   ← 表情反应
│       ├── emoji.ts       ← 自定义表情
│       └── utils.ts       ← 共享工具
│
└── api/                   ← Hono REST API
    ├── index.ts           ← Hono app 入口 + 路由
    ├── env.ts             ← 环境变量读取
    ├── helpers/
    │   └── channel.ts     ← 频道配置 + 缓存策略
    ├── middleware/
    │   ├── cors.ts        ← CORS
    │   └── cache.ts       ← KV 缓存 + Cache-Control
    └── routes/
        ├── info.ts        ← GET /api/v1/ch/:channel/info
        ├── posts.ts       ← GET /api/v1/ch/:channel/posts, /posts/:id
        ├── media.ts       ← GET /api/v1/ch/:channel/media/images, /media/videos
        ├── tags.ts        ← GET /api/v1/ch/:channel/tags
        └── heatmap.ts     ← GET /api/v1/ch/:channel/heatmap
```

## 在前端中使用

打开 `examples/test.html`（浏览器直接打开，无需服务器），填入 API 地址和频道名即可可视化测试所有端点。

或在代码中调用：

```javascript
const API = 'https://your-domain.workers.dev'

// 获取某个频道的帖子
const res = await fetch(`${API}/api/v1/ch/your_channel/posts`)
const { posts } = await res.json()

// 渲染图片帖子（图库模式）
const images = posts.flatMap(post =>
  post.blocks
    .filter(b => b.type === 'image')
    .map(img => ({ postId: post.id, ...img }))
)

// 渲染视频列表（视频站模式）
const videos = posts.flatMap(post =>
  post.blocks
    .filter(b => b.type === 'video')
    .map(v => ({ postId: post.id, ...v }))
)

// 获取热力图数据（用于 GitHub 风格贡献图）
const heatmap = await fetch(`${API}/api/v1/ch/your_channel/heatmap?year=2026`)
const { data } = await heatmap.json()

// 列出所有可用频道
const channelsResp = await fetch(`${API}/api/v1/ch`)
const { channels } = await channelsResp.json()
```

## 许可

AGPL-3.0
