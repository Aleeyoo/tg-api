export interface TelegramConfig {
  /** Telegram 频道用户名（不含 @） */
  channel: string
  /** Telegram 服务器地址，默认 t.me */
  telegramHost?: string
  /** 静态资源代理前缀 */
  staticProxy?: string
  /** 是否解析 reactions */
  reactionsEnabled?: boolean
  /** 视频代理大小上限（MB），超过此大小的视频不代理，proxy 回退到 src */
  proxyMaxSizeMb?: number
}

export const defaultConfig: Partial<TelegramConfig> = {
  telegramHost: 't.me',
  staticProxy: '/static/',
  reactionsEnabled: false,
  proxyMaxSizeMb: 100,
}
