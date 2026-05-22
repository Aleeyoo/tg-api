import type { Post, ChannelInfo, QueryParams } from './types'
import type { TelegramConfig } from './config'
import { defaultConfig } from './config'
import { fetchChannelDocument } from './fetcher'
import { parseHtml, parseSinglePostHtml } from './parser'
import { extractBlocks } from './blocks'
import { extractReactions } from './blocks/reactions'
import { extractChannelInfo } from './channel'
import { LRUCacheAdapter, type CacheAdapter } from './cache'

const TITLE_PREVIEW_REGEX = /^.*?(?=[。\n]|http\S)/g
const CONTENT_URL_REGEX = /(url\(["'])((https?:)?\/\/)/g

/**
 * Main entry point for fetching and parsing Telegram channel data.
 *
 * Usage:
 *   const client = new TelegramClient({ channel: 'my_channel' })
 *   const posts = await client.getPosts()
 */
export class TelegramClient {
  private config: TelegramConfig
  private cache: CacheAdapter<Post[] | Post | ChannelInfo>

  constructor(config: TelegramConfig, cache?: CacheAdapter<Post[] | Post | ChannelInfo>) {
    this.config = { ...defaultConfig, ...config }
    this.cache = cache ?? new LRUCacheAdapter()
  }

  /**
   * Get channel metadata (title, description, avatar).
   */
  async getChannelInfo(request?: Request): Promise<ChannelInfo> {
    const key = `channel:${this.config.channel}`
    const cached = this.cache.get(key)
    if (cached && 'title' in cached && 'posts' in cached === false) {
      return structuredClone(cached) as ChannelInfo
    }

    const html = await fetchChannelDocument(this.config, {}, request)
    const { $ } = parseHtml(html)
    const info = extractChannelInfo($)

    this.cache.set(key, info)
    return structuredClone(info)
  }

  /**
   * Get post list with optional cursor-based pagination and tag filter.
   */
  async getPosts(params: QueryParams = {}, request?: Request): Promise<Post[]> {
    const { before, after, q } = params
    const key = JSON.stringify({ scope: 'posts', before, after, q, channel: this.config.channel })
    const cached = this.cache.get(key)
    if (cached && Array.isArray(cached)) {
      return structuredClone(cached) as Post[]
    }

    const html = await fetchChannelDocument(this.config, { before, after, q }, request)
    const { $, messageNodes } = parseHtml(html)
    const staticProxy = this.config.staticProxy ?? '/static/'

    const posts: Post[] = []

    for (const [index, node] of messageNodes.entries()) {
      const msg = $(node).find('.tgme_widget_message')

      // Skip service messages
      if (msg.attr('class')?.includes('service_message')) continue

      const id = msg.attr('data-post')?.replace(new RegExp(`${this.config.channel}/`, 'i'), '') ?? ''
      if (!id) continue

      const blocks = extractBlocks($, node, index, staticProxy, this.config.channel)
      if (blocks.length === 0) continue

      // Derive title from first text block
      const textBlock = blocks.find(b => b.type === 'text')
      const contentText = textBlock?.type === 'text' ? textBlock.plain : ''
      const title = contentText.match(TITLE_PREVIEW_REGEX)?.[0] ?? contentText

      // Collect tags from text block links
      const tags: string[] = []
      if (textBlock?.type === 'text') {
        // Parse tags from the original message (not processed clone)
        const msgNode = $(node)
        for (const tagNode of msgNode.find('a[href^="?q="]').toArray()) {
          const tagText = $(tagNode).text().replace('#', '')
          if (tagText) tags.push(tagText)
        }
      }

      const datetime = msg.find('.tgme_widget_message_date time').attr('datetime') ?? ''

      posts.push({
        id,
        title: title || id,
        datetime,
        blocks,
        tags,
        reactions: [],
      })
    }

    posts.reverse()

    this.cache.set(key, posts)
    return structuredClone(posts)
  }

  /**
   * Get a single post by its ID.
   */
  async getPost(id: string, request?: Request): Promise<Post> {
    const key = JSON.stringify({ scope: 'post', id, channel: this.config.channel })
    const cached = this.cache.get(key)
    if (cached && 'id' in cached && !('posts' in cached)) {
      return structuredClone(cached) as Post
    }

    const html = await fetchChannelDocument(this.config, { id }, request)
    const { $ } = parseSinglePostHtml(html)
    const staticProxy = this.config.staticProxy ?? '/static/'

    const msg = $('.tgme_widget_message')
    const rawId = msg.attr('data-post')?.replace(new RegExp(`${this.config.channel}/`, 'i'), '') ?? id
    const datetime = msg.find('.tgme_widget_message_date time').attr('datetime') ?? ''

    // Build a fake wrap node for the blocks to work with
    const wrap = $('<div>').append(msg.clone())

    const blocks = extractBlocks($, wrap[0], 0, staticProxy, this.config.channel)
    const textBlock = blocks.find(b => b.type === 'text')
    const contentText = textBlock?.type === 'text' ? textBlock.plain : ''
    const title = contentText.match(TITLE_PREVIEW_REGEX)?.[0] ?? contentText

    const tags: string[] = []
    for (const tagNode of msg.find('a[href^="?q="]').toArray()) {
      const tagText = $(tagNode).text().replace('#', '')
      if (tagText) tags.push(tagText)
    }

    const reactions = this.config.reactionsEnabled
      ? extractReactions($, wrap[0], staticProxy)
      : []

    const post: Post = {
      id: rawId,
      title: title || rawId,
      datetime,
      blocks,
      tags,
      reactions,
    }

    this.cache.set(key, post)
    return structuredClone(post)
  }
}
