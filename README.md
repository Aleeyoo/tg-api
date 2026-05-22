<p align="center">
  <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" width="200">
</p>

# tg-api

**把你的 Telegram 频道变成结构化 JSON 数据。** 部署一个 API，所有前端都能用。

```
t.me HTML  →  core/ 解析管道  →  结构化 Block[]  →  REST API
```

---

## 能用它做什么？

| 你想做 | 用这个 API | 例子 |
|--------|-----------|------|
| **个人博客** | `GET /posts` 拿帖子列表 | 你的 Telegram 频道就是你的博客后台 |
| **图片站** | `GET /media/images` 拿所有图片 | 摄影频道自动变图库 |
| **视频站** | `GET /media/videos` 拿所有视频 | 视频频道自动变视频站 |
| **活跃度热力图** | `GET /heatmap` 拿日活数据 | 像 GitHub 贡献图一样展示发帖节奏 |
| **标签导航** | `GET /tags` 拿标签聚合 | 按主题浏览内容 |

**数据源头是 Telegram，数据消费是任意前端。** 你在 Telegram 发帖，你的网站自动更新。

---

## 快速开始

```bash
pnpm install
pnpm dev
curl http://localhost:8787/api/v1/ch/my_channel/info
```

部署到 Cloudflare Pages 也是一键的事。

---

## API 一览

所有端点以 `/api/v1/` 开头。

| 端点 | 作用 |
|------|------|
| `GET /ch/:channel/info` | 频道名称、描述、头像 |
| `GET /ch/:channel/posts` | 帖子列表（支持翻页和标签筛选） |
| `GET /ch/:channel/posts/:id` | 单篇帖子详情 |
| `GET /ch/:channel/media/images` | 展平所有图片 → 图库 |
| `GET /ch/:channel/media/videos` | 展平所有视频 → 视频站 |
| `GET /ch/:channel/tags` | 标签聚合 |
| `GET /ch/:channel/heatmap` | GitHub 风格热力图数据 |
| `GET /ch` | 列出可用的频道 |

每条帖子返回的不是 HTML 片段，而是结构化的 **Block 数组**：

```json
{
  "id": "123",
  "datetime": "2026-05-22T10:30:00Z",
  "blocks": [
    { "type": "reply", "postId": "122", "text": "回复原文..." },
    { "type": "image", "src": "https://...jpg", "width": 800, "height": 600 },
    { "type": "text", "html": "<b>今天拍的</b>", "plain": "今天拍的" },
    { "type": "reactions", "items": [{ "emoji": "❤️", "count": "12" }] }
  ],
  "tags": ["摄影"],
  "reactions": []
}
```

每种 Block 类型带有自己的字段——图片有宽高，视频有时长，链接有标题和描述。前端拿到什么类型就渲染什么类型。

**完整的 Block 类型参考见 [Block 类型参考](#block-类型参考)。**

---

## 部署

### 一键部署

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Aleeyoo/tg-api)

点击按钮，授权 Cloudflare 访问你的 GitHub 仓库，自动部署。

### 手动部署到 Cloudflare Pages

1. 推送代码到 GitHub
2. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择 tg-api 仓库，框架选 **None**，构建命令留空
4. 部署后在 **Settings → KV namespace bindings** 中添加 `CACHE`（可选）
5. 在 **Environment variables** 中添加你的配置

**KV 不是必需的。** 不配 KV 也能用，只是冷启动时会重新抓取 Telegram。

### 环境变量

| 变量 | 说明 |
|------|------|
| `CHANNELS` | 白名单（逗号分隔），匹配的频道走 KV 缓存 |
| `STRICT_MODE` | `true` 时只允许白名单内的频道 |
| `CACHE_TTL` | KV 缓存秒数（默认 300） |
| `TELEGRAM_HOST` | 默认 `t.me`，可换镜像 |
| `STATIC_PROXY` | 静态资源代理前缀 |

---

## 前端接入示例

```javascript
const TG = 'https://your-domain.workers.dev/api/v1/ch'

// 取帖子
const { posts } = await fetch(`${TG}/my_channel/posts`).then(r => r.json())

// 图库：只取图片
const images = posts.flatMap(p =>
  p.blocks.filter(b => b.type === 'image')
)

// 视频站：只取视频
const videos = posts.flatMap(p =>
  p.blocks.filter(b => b.type === 'video')
)

// 热力图
const { data } = await fetch(`${TG}/my_channel/heatmap`).then(r => r.json())

// 列出可用频道
const { channels } = await fetch(`/api/v1/ch`).then(r => r.json())
```

也可以用 `examples/test.html` 做可视化测试——浏览器直接打开，填入地址即可。

---

## 数据流

```
请求 → 频道允许? → KV 缓存? → LRU 缓存? → fetch(t.me) → 解析 → Block[]
                                                               ↓
                                                          返回 JSON
```

两个缓存层：
- **LRU** — Worker 内存，5 分钟过期
- **KV** — Cloudflare KV，跨实例共享，5 分钟过期

---

## 项目结构

```
src/
├── core/        Telegram 解析管道（纯逻辑，框架无关）
│   ├── types.ts        ← 13 种 Block 联合类型
│   ├── client.ts       ← 主入口
│   ├── fetcher.ts      ← HTTP 请求
│   ├── parser.ts       ← cheerio 解析
│   ├── cache.ts        ← LRU 缓存
│   ├── channel.ts      ← 频道信息
│   └── blocks/         ← 12 种内容类型提取器
│
└── api/         Hono REST API
    ├── index.ts        ← 路由注册
    ├── helpers/        ← 频道配置 + 缓存策略
    ├── middleware/      ← CORS + KV 缓存
    └── routes/         ← 5 个路由处理器
```

---

## Block 类型参考

每个 Block 是一个带 `type` 标签的联合类型：

| 类型 | 关键字段 | 说明 |
|------|---------|------|
| `text` | `html`, `plain` | 格式化文本，含代码高亮、展开块、spoiler |
| `image` | `src`, `width`, `height` | 图片，含 Telegram 推断的尺寸 |
| `video` | `src`, `width`, `height`, `isRound` | 视频和圆形视频 |
| `audio` | `src` | 语音消息 |
| `sticker` | `src`, `width`, `height` | 静态贴纸 |
| `video_sticker` | `src`, `poster` | 动态贴纸 |
| `link_preview` | `url`, `title`, `description`, `image` | 链接预览卡片 |
| `reply` | `postId`, `text` | 回复引用 |
| `poll` | `question`, `options` | 投票 |
| `document` | `src`, `name`, `size` | 文件 |
| `location` | `latitude`, `longitude` | 位置信息 |

---

## 许可

AGPL-3.0
