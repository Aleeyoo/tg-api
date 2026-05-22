# API 参考

所有端点路径前缀 `/api/v1/`，返回 JSON。

---

## 端点

### `GET /ch/:channel/info`

频道基本信息。

```json
{
  "title": "频道名称",
  "description": "频道描述",
  "descriptionHTML": "<b>频道描述</b>（含 HTML）",
  "avatar": "https://cdn5.telesco.pe/...jpg"
}
```

### `GET /ch/:channel/posts`

帖子列表。可选参数：

| 参数 | 说明 |
|------|------|
| `before` | 游标翻页：此 ID 之前的帖子 |
| `after` | 游标翻页：此 ID 之后的帖子 |
| `q` | 标签筛选，如 `q=#tech` |

```json
{
  "posts": [
    {
      "id": "123",
      "title": "帖子标题",
      "datetime": "2026-05-22T10:30:00Z",
      "blocks": [...],
      "tags": ["tech"],
      "reactions": []
    }
  ]
}
```

### `GET /ch/:channel/posts/:id`

单篇帖子详情，结构同上。

### `GET /ch/:channel/media/images`

展平所有帖子中的图片，适用于图库前端。

```json
{
  "items": [
    { "postId": "123", "postTitle": "...", "image": { "type": "image", ... } }
  ]
}
```

### `GET /ch/:channel/media/videos`

展平所有帖子中的视频，适用于视频站前端。结构同上。

### `GET /ch/:channel/tags`

标签聚合统计。

```json
{
  "tags": [
    { "name": "tech", "count": 12 },
    { "name": "news", "count": 5 }
  ]
}
```

### `GET /ch/:channel/heatmap`

热力图数据（GitHub contribution graph 风格）。可选参数 `year`（默认当前年份）。

```json
{
  "year": 2026,
  "total": 8,
  "data": [
    { "date": "2026-01-01", "count": 0 },
    { "date": "2026-02-27", "count": 1 }
  ]
}
```

### `GET /ch`

列出可用频道（需要设置 `CHANNELS` 环境变量）。

```json
{ "channels": ["me011205", "channel2"] }
```

### `GET /health`

健康检查。

```json
{ "status": "ok", "timestamp": "2026-05-22T07:59:22Z" }
```

---

## Block 类型

每条帖子的 `blocks` 数组包含多个内容块，每个块由 `type` 字段区分。

### `text` — 文本

```json
{
  "id": "block-text-0",
  "type": "text",
  "html": "<b>粗体</b> <a href=\"...\">链接</a>",
  "plain": "粗体 链接"
}
```

支持：粗体、斜体、链接、代码高亮、展开块、spoiler、自定义表情。

### `image` — 图片

```json
{
  "id": "block-image-0",
  "type": "image",
  "src": "https://cdn5.telesco.pe/...jpg",
  "proxy": "/static/https://...jpg",
  "width": 1200,
  "height": 800
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
  "duration": 30,
  "poster": "https://...jpg",
  "isRound": false
}
```

### `audio` — 语音消息

```json
{
  "id": "block-audio-0",
  "type": "audio",
  "src": "https://cdn5.telesco.pe/...ogg",
  "proxy": "/static/https://...ogg",
  "duration": 45
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
  "isAnonymous": true,
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
  "mimeType": "application/pdf",
  "thumb": "/static/https://...jpg"
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

---

## 数据流

```
请求 → STRICT_MODE + CHANNELS 校验 → 403
  │
  ▼ 通过
KV 缓存? → 命中 → 返回
  │
  ▼ 未命中
LRU 内存缓存? → 命中 → 写入 KV → 返回
  │
  ▼ 都未命中
fetch(t.me/s/{channel}) → cheerio 解析 → Block[] → 写入 LRU + KV → 返回 JSON
```

- **LRU**: Worker 内存缓存，5 分钟 TTL
- **KV**: Cloudflare KV 缓存，跨实例共享，TTL 可配置

每个响应带 `X-Tg-Cache` 头：`kv+lru`（KV 缓存命中）或 `lru_only`（仅 LRU 缓存）。
