// ── 基础接口 ──

export interface BaseBlock {
  /** 块在 post 内的唯一标识，如 "block-0", "block-1" */
  id: string
}

// ── 文本 ──

export interface TextBlock extends BaseBlock {
  type: 'text'
  /** 渲染后的 HTML（保留粗体、代码、链接、表情等格式） */
  html: string
  /** 纯文本（用于搜索摘要 / RSS） */
  plain: string
}

// ── 图片 ──

export interface ImageBlock extends BaseBlock {
  type: 'image'
  /** 原始 Telegram CDN URL */
  src: string
  /** 代理 URL */
  proxy: string
  width: number
  height: number
}

// ── 视频 ──

export interface VideoBlock extends BaseBlock {
  type: 'video'
  src: string
  proxy: string
  width: number
  height: number
  duration?: number
  poster?: string
  /** 是否为圆形视频（Telegram 圆形视频） */
  isRound?: boolean
}

// ── 语音消息 ──

export interface AudioBlock extends BaseBlock {
  type: 'audio'
  src: string
  proxy: string
  duration?: number
}

// ── 静态贴纸 ──

export interface StickerBlock extends BaseBlock {
  type: 'sticker'
  src: string
  proxy: string
  width: number
  height: number
}

// ── 动态贴纸 ──

export interface VideoStickerBlock extends BaseBlock {
  type: 'video_sticker'
  src: string
  proxy: string
  /** 预览图（静态回退） */
  poster: string
  width: number
  height: number
}

// ── 链接预览 ──

export interface LinkPreviewBlock extends BaseBlock {
  type: 'link_preview'
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

// ── 回复引用 ──

export interface ReplyBlock extends BaseBlock {
  type: 'reply'
  /** 被回复的 post ID */
  postId: string
  /** 回复摘要文本 */
  text: string
}

// ── 投票 ──

export interface PollBlock extends BaseBlock {
  type: 'poll'
  question: string
  options: Array<{ label: string; percent: string }>
  isAnonymous?: boolean
  totalVotes?: string
}

// ── 文件 ──

export interface DocumentBlock extends BaseBlock {
  type: 'document'
  src: string
  name: string
  size?: number
  mimeType?: string
  thumb?: string
}

// ── 位置 ──

export interface LocationBlock extends BaseBlock {
  type: 'location'
  latitude: number
  longitude: number
  /** Telegram 地图缩略图 URL */
  image?: string
}

// ── 联合类型 ──

export type Block =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | StickerBlock
  | VideoStickerBlock
  | LinkPreviewBlock
  | ReplyBlock
  | PollBlock
  | DocumentBlock
  | LocationBlock

// ── Post ──

export interface Reaction {
  emoji: string
  emojiId?: string
  emojiImage?: string
  count: string
  isPaid: boolean
}

export interface Post {
  id: string
  title: string
  datetime: string
  blocks: Block[]
  tags: string[]
  reactions: Reaction[]
}

// ── 频道 ──

export interface ChannelInfo {
  title: string
  description: string
  descriptionHTML: string | null
  avatar?: string
}

// ── 查询参数 ──

export interface QueryParams {
  before?: string
  after?: string
  q?: string
}
