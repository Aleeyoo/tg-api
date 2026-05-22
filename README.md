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

每条帖子返回结构化的 **Block 数组**，每块的 `type` 字段标明内容类型：

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
  "tags": ["摄影"]
}
```

每种 Block 有自己的字段——图片有宽高，视频有时长，链接有标题和描述。**完整参考见 [`docs/api.md`](docs/api.md)。**

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
5. 在 **Environment variables** 中添加：

| 变量 | 说明 |
|------|------|
| `CHANNELS` | 白名单（逗号分隔），匹配的频道走 KV 缓存 |
| `STRICT_MODE` | `true` 时只允许白名单内的频道 |
| `CACHE_TTL` | KV 缓存秒数（默认 300） |
| `TELEGRAM_HOST` | 默认 `t.me`，可换镜像 |
| `STATIC_PROXY` | 静态资源代理前缀 |

KV 不是必需的。不配 KV 也能用，只是冷启动时会重新抓取 Telegram。

---

## 前端接入示例

```javascript
const TG = 'https://your-domain.workers.dev/api/v1/ch'

const { posts } = await fetch(`${TG}/my_channel/posts`).then(r => r.json())

// 图库模式：只取图片
const images = posts.flatMap(p =>
  p.blocks.filter(b => b.type === 'image')
)

// 视频站模式：只取视频
const videos = posts.flatMap(p =>
  p.blocks.filter(b => b.type === 'video')
)

// 热力图
const { data } = await fetch(`${TG}/my_channel/heatmap`).then(r => r.json())

// 列出可用频道
const { channels } = await fetch(`/api/v1/ch`).then(r => r.json())
```

可视化测试：`examples/test.html`（浏览器直接打开，填入地址即可）。

---

## 许可

AGPL-3.0
