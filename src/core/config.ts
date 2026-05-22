export interface TelegramConfig {
  /** Telegram 频道用户名（不含 @） */
  channel: string
  /** Telegram 服务器地址，默认 t.me */
  telegramHost?: string
  /** 静态资源代理前缀 */
  staticProxy?: string
  /** 是否解析 reactions */
  reactionsEnabled?: boolean
}

export const defaultConfig: Partial<TelegramConfig> = {
  telegramHost: 't.me',
  staticProxy: '/static/',
  reactionsEnabled: false,
}
